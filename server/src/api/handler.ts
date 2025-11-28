import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { hashPassword, checkPasswordHash, makeJWT, getBearerToken, validateJWT, makeRefreshToken, getAPIKey } from "./auth.js";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "./errors.js";
import { insertRefreshToken, findRefreshTokenWithUser, revokeRefreshToken } from "../db/queries/refreshTokens.js";
import { createUser, getUserByEmail, deleteAllUsers, updateUserCredentials, upgradeUserToChirpyRed } from "../db/queries/users.js";
import { createChirp, listChirpsAscending, getChirpById, deleteChirpOwnedByUser} from "../db/queries/chirps.js";

function requireEmailAndPassword(req: Request) {
  const email = req.body?.email;
  const password = req.body?.password;
  if (typeof email !== "string" || email.trim() === "") {
    throw new BadRequestError("Invalid request: 'email' must be a non-empty string");
  }
  if (typeof password !== "string" || password.length === 0) {
    throw new BadRequestError("Invalid request: 'password' must be a non-empty string");
  }
  return { email: email.trim().toLowerCase(), password };
}

export function handlerMetrics(req: Request, res: Response) {
    const html = `<!doctype html>
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>`;
  res.set("Content-Type", "text/html; charset=utf-8").send(html);
}

export async function handlerReset(_req: Request, res: Response, next: NextFunction) {
  try {
    if (config.api.platform !== "dev") {
      throw new ForbiddenError("Forbidden");
    }
    await deleteAllUsers();
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function handlerCreateChirp(req: Request, res: Response, next: NextFunction) {
  
  try {
    const token = getBearerToken(req);

    const body = req.body?.body;
    const userId = validateJWT(token, config.api.jwtSecret);

    if (typeof body !== "string") {
      throw new BadRequestError("Invalid request: 'body' must be a string" );
    }

    const text = body.trim();
    if (text.length === 0) {
      throw new BadRequestError("Chirp is empty" );
    }

    if (text.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }

    if (typeof userId !== "string") {
      throw new BadRequestError("Invalid request: 'userId' must be a UUID");
    }

    const msgArray = body.split(" ");
    const banned = ["kerfuffle", "sharbert", "fornax"];
    while (msgArray.some(w => banned.includes(w.toLowerCase()))) {
        const idx = msgArray.findIndex(w => banned.includes(w.toLowerCase()));
        msgArray[idx] = "****";
    }
    const newMsg = msgArray.join(" ");

    const chirp = await createChirp({ body: newMsg, userId });

    return res.status(201).json(chirp);
  } catch(err) {
    // return res.status(500).json({ error: "Something went wrong" });
    return next(err);
  }
  
}

export async function handlerCreateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = requireEmailAndPassword(req);
    const hashed = await hashPassword(password);

    let user = await createUser({ email, hashedPassword: hashed });
    if (!user) {
      user = await getUserByEmail(email);
    }

    if (!user) throw new Error("Failed to create or fetch user");

    const { hashedPassword: _hp, ...publicUser } = user;
    res.status(user.createdAt instanceof Date ? 201 : 200).json(publicUser);
  } catch (err) {
    next(err);
  }
}

export async function handlerListChirps(req: Request, res: Response, next: NextFunction) {
  try {
    const chirps = await listChirpsAscending();

    let authorId = "";
    let authorIdQuery = req.query.authorId;
    if (typeof authorIdQuery === "string") {
      authorId = authorIdQuery;
    }

    let sort = "";
    let sortQuery = req.query.sort;
    if (typeof sortQuery === "string") {
      sort = sortQuery;
    }

    const filteredChirps = chirps.filter(
      (chirp) => chirp.userId === authorId || authorId === "",
    );
    sort === "desc" ? filteredChirps.reverse() : filteredChirps;
    res.status(200).json(filteredChirps); // array of authors chirps
  } catch (err) {
    next(err);
  }
}

export async function handlerGetChirp(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.chirpID);
    if (!id) {
      return res.sendStatus(404);
    }

    const chirp = await getChirpById(id);
    if (!chirp) {
      return res.sendStatus(404);
    }

    return res.status(200).json(chirp);
  } catch (err) {
    next(err);
  }
}

export async function handlerLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = requireEmailAndPassword(req);

    const user = await getUserByEmail(email);
    if (!user || user.hashedPassword === "unset") {
      throw new UnauthorizedError("Incorrect email or password");
    }

    const ok = await checkPasswordHash(password, user.hashedPassword);
    if (!ok) {
      throw new UnauthorizedError("Incorrect email or password");
    }

    let exp = 3600; //1 hour
    const token = makeJWT(user.id, exp, config.api.jwtSecret);

    const refreshToken = makeRefreshToken();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await insertRefreshToken({ token: refreshToken, userId: user.id, expiresAt});

    const { hashedPassword: _hp, ...publicUser } = user;
    res.status(200).json({...publicUser, token, refreshToken });
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    return next(new UnauthorizedError("Incorrect email or password"));
  }
}

export async function handlerRefresh(req: Request, res: Response, next: NextFunction) {
  try {
    const tokenString = getBearerToken(req); // from Authorization: Bearer <refreshToken>
    const row = await findRefreshTokenWithUser(tokenString);
    if (!row) throw new UnauthorizedError("Invalid or expired refresh token");

    const { token, user } = row;
    const now = new Date();
    if (token.revokedAt || token.expiresAt <= now) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // New access token for 1 hour
    const access = makeJWT(user.id, 3600, config.api.jwtSecret);
    res.status(200).json({ token: access });
  } catch (err) {
    next(err);
  }
}

export async function handlerRevoke(req: Request, res: Response, next: NextFunction) {
  try {
    const tokenString = getBearerToken(req);
    // Revoke if it exists; spec doesn't require 404 if missing
    await revokeRefreshToken(tokenString);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function handlerUpdateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // 1) Auth: must have a valid access token
    const token = getBearerToken(req); // throws 401 if missing/malformed
    const userId = validateJWT(token, config.api.jwtSecret); // throws 401 if invalid/expired

    // 2) Validate body
    const { email, password } = requireEmailAndPassword(req);
    const hashed = await hashPassword(password);

    // 3) Update this user only (ignore any userId in body)
    const user = await updateUserCredentials(userId, { email, hashedPassword: hashed });
    if (!user) throw new UnauthorizedError("Invalid or expired token"); // no matching user

    // 4) Omit password in response
    const { hashedPassword: _hp, ...publicUser } = user;
    res.status(200).json(publicUser);
  } catch (err) {
    next(err);
  }
}

export async function handlerDeleteChirp(req: Request, res: Response, next: NextFunction) {
  try {
    // Auth
    const token = getBearerToken(req);                 // throws 401 if missing/malformed
    const userId = validateJWT(token, config.api.jwtSecret); // throws 401 if invalid/expired

    const id = String(req.params.chirpID || "");
    if (!id) return res.sendStatus(404);

    const chirp = await getChirpById(id);
    if (!chirp) return res.sendStatus(404);

    if (chirp.userId !== userId) return res.sendStatus(403);

    const deleted = await deleteChirpOwnedByUser(id, userId);
    if (!deleted) return res.sendStatus(404); // race: already deleted

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export async function handlerPolkaWebhooks(req: Request, res: Response, next: NextFunction) {
  try {
    const event = req.body?.event;
    if (event !== "user.upgraded") {
      return res.sendStatus(204); // ignore all other events
    }

    const userId = req.body?.data?.userId;
    if (typeof userId !== "string") {
      return res.sendStatus(404); // treat invalid/missing ID as not found
    }

    const apiKey = getAPIKey(req);
    if (apiKey !== config.api.polkaKey) {
      return res.sendStatus(401);
    }

    const updated = await upgradeUserToChirpyRed(userId);
    if (!updated) return res.sendStatus(404);

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}