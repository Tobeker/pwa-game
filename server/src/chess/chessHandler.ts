import type { Request, Response, NextFunction } from "express";
import { applyMoveToGame, createGame, getGameState, loadGameFromRow } from "./chessLogic.js";
import { BadRequestError } from "../api/errors.js";
import { config } from "../config.js";
import { getBearerToken, validateJWT } from "../api/auth.js";
import type { CreateGameRequest } from "./chessTypes.js";
import { getChessGameById, insertChessGame, updateChessGame, listChessGamesForUserName } from "../db/queries/chessGames.js";
import { getUserById } from "../db/queries/users.js";

const opponentTypes = ["computer", "human"] as const;
const playerColors = ["white", "black", "random"] as const;

function assertCreateGameBody(body: unknown): CreateGameRequest {
  if (typeof body !== "object" || body === null) {
    throw new BadRequestError("Invalid body");
  }
  const { opponentType, playerColor, opponentName } = body as CreateGameRequest;
  if (!opponentTypes.includes(opponentType as any)) {
    throw new BadRequestError(`Invalid opponentType: expected ${opponentTypes.join(" | ")}`);
  }
  if (!playerColors.includes(playerColor as any)) {
    throw new BadRequestError(`Invalid playerColor: expected ${playerColors.join(" | ")}`);
  }
  if (opponentType === "human" && (typeof opponentName !== "string" || opponentName.trim() === "")) {
    throw new BadRequestError("Invalid opponentName");
  }
  return { opponentType, playerColor, opponentName };
}

type MoveBody = { from: string; to: string; promotion?: string };

function assertMoveBody(body: unknown): MoveBody {
  if (typeof body !== "object" || body === null) {
    throw new BadRequestError("Invalid body");
  }
  const { from, to, promotion } = body as Partial<MoveBody>;
  if (typeof from !== "string" || typeof to !== "string") {
    throw new BadRequestError("Missing or invalid move coordinates");
  }
  if (promotion !== undefined && typeof promotion !== "string") {
    throw new BadRequestError("Invalid promotion value");
  }
  return { from, to, promotion };
}

export async function handlerCreateChessGame(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertCreateGameBody(req.body);
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);
    const user = await getUserById(userId);
    const userName = user?.email ?? "unknown";

    const game = createGame({ userId, userName, opponentType: body.opponentType, playerColor: body.playerColor, opponentName: body.opponentName });

    const userColor = game.players.white === userName ? "white" : "black";
    await insertChessGame({
      id: game.id,
      fen: game.fen,
      status: game.status,
      turn: game.turn,
      opponentType: body.opponentType,
      playerColor: userColor,
      players: game.players,
      moves: game.moves,
      createdBy: userId,
    });

    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
}

export async function handlerMakeChessMove(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);
    const user = await getUserById(userId);
    const userName = user?.email ?? "unknown";
    const id = String(req.params.id || "");
    if (!id) {
      throw new BadRequestError("Missing game id");
    }
    const move = assertMoveBody(req.body);

    let game = getGameState(id);
    if (!game) {
      const row = await getChessGameById(id);
      if (!row) {
        return res.sendStatus(404);
      }
      game = loadGameFromRow(row);
    }

    if (game.players.white !== userName && game.players.black !== userName) {
      return res.status(403).json({ error: "Not a participant of this game" });
    }

    const updated = applyMoveToGame(id, move);
    if (!updated) {
      throw new BadRequestError("Illegal move");
    }

    await updateChessGame(id, {
      fen: updated.fen,
      status: updated.status,
      turn: updated.turn,
      players: updated.players,
      moves: updated.moves,
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function handlerGetChessGame(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    validateJWT(token, config.api.jwtSecret);
    const id = String(req.params.id || "");
    if (!id) {
      throw new BadRequestError("Missing game id");
    }

    // Prefer in-memory state if present to get live moves/turn
    const memoryGame = getGameState(id);
    if (memoryGame) {
      return res.status(200).json(memoryGame);
    }

    const row = await getChessGameById(id);
    if (!row) {
      return res.sendStatus(404);
    }

    return res.status(200).json({
      id: row.id,
      fen: row.fen,
      status: row.status,
      turn: row.turn,
      players: row.players,
      moves: row.moves,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlerListChessGames(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);
    const user = await getUserById(userId);
    const userName = user?.email ?? "unknown";
    const rows = await listChessGamesForUserName(userId, userName);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
}
