import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { UnauthorizedError } from "./errors.js";
import type { Request } from "express";

const DEFAULT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, DEFAULT_ROUNDS);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload:payload = {
    iss: "chirp",
    sub: userID,
    iat: iat,
    exp: iat + expiresIn,
  };
  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decoded = jwt.verify(tokenString, secret) as JwtPayload | string;

    if (typeof decoded === "string" || typeof decoded.sub !== "string" || decoded.sub.length === 0) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    return decoded.sub;
  } catch (_err) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function getBearerToken(req: Request): string {
    const header = req.get("authorization");
    if (!header) throw new UnauthorizedError("Missing Authorization header");
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new UnauthorizedError("Invalid Authorization header");
    return match[1].trim();
}

export function makeRefreshToken(): string {
  return randomBytes(32).toString("hex"); // 64-char hex
}

/*export function getAPIKey(req: Request): string {
    const header = req.get("authorization");
    if (!header) throw new UnauthorizedError("Missing Authorization header");
    const match = header.match(/^ApiKey\s+(.+)$/i);
    if (!match) throw new UnauthorizedError("Invalid Authorization header");
    return match[1].trim();
}*/