import type { Request, Response, NextFunction } from "express";
import { createGame } from "./chessLogic.js";
import { BadRequestError } from "../api/errors.js";
import { config } from "../config.js";
import { getBearerToken, validateJWT } from "../api/auth.js";
import type { CreateGameRequest } from "./chessTypes.js";
import { insertChessGame } from "../db/queries/chessGames.js";

const opponentTypes = ["computer", "human"] as const;
const playerColors = ["white", "black", "random"] as const;

function assertCreateGameBody(body: unknown): CreateGameRequest {
  if (typeof body !== "object" || body === null) {
    throw new BadRequestError("Invalid body");
  }
  const { opponentType, playerColor } = body as Partial<CreateGameRequest>;
  /* if (!opponentTypes.includes(opponentType as any)) {
    throw new BadRequestError(`Invalid opponentType: expected ${opponentTypes.join(" | ")}`);
  }
  if (!playerColors.includes(playerColor as any)) {
    throw new BadRequestError(`Invalid playerColor: expected ${playerColors.join(" | ")}`);
  }*/
  return { opponentType: opponentType as any, playerColor: playerColor as any };
}

export async function handlerCreateChessGame(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assertCreateGameBody(req.body);
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);

    const game = createGame({ userId, opponentType: body.opponentType, playerColor: body.playerColor });

    const userColor = game.players.white === userId ? "white" : "black";
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
