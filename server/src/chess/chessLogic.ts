import { randomUUID } from "crypto";
import { Chess } from "chess.js";
import type { ChessGame, CreateGameRequest, GameStatus, OpponentType, PlayerColor, PlayerMap } from "./chessTypes.js";
import type { Chess as ChessRow } from "../db/schema.js";

const games = new Map<string, Chess>();
const gameMetadata = new Map<string, { players: PlayerMap }>();

function pickColor(requested: PlayerColor): "white" | "black" {
  if (requested === "random") {
    return Math.random() < 0.5 ? "white" : "black";
  }
  return requested;
}

function buildPlayers(userId: string, opponentType: OpponentType, color: "white" | "black"): PlayerMap {
  const opponentName = opponentType === "computer" ? "computer" : "human";
  return color === "white"
    ? { white: userId, black: opponentName }
    : { white: opponentName, black: userId };
}

export function createGame(params: { userId: string } & CreateGameRequest): ChessGame {
  const color = pickColor(params.playerColor);
  const id = `game_${randomUUID()}`;
  const chess = new Chess(); // start position
  const players = buildPlayers(params.userId, params.opponentType, color);

  games.set(id, chess);
  gameMetadata.set(id, { players });

  return {
    id,
    fen: chess.fen(),
    status: "ongoing",
    turn: chess.turn(),
    players,
    moves: [],
  };
}

// GameState is saved in memory, but for safety also in database
export function getGameState(id: string): ChessGame | undefined {
  const chess = games.get(id);
  const meta = gameMetadata.get(id);
  if (!chess || !meta) return undefined;
  return {
    id,
    fen: chess.fen(),
    status: chess.isCheckmate() ? "checkmate" : chess.isDraw() ? "draw" : "ongoing",
    turn: chess.turn(),
    players: meta.players,
    moves: chess.history(),
  };
}

function statusFromChess(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return "checkmate";
  if (chess.isDraw()) return "draw";
  return "ongoing";
}

export function loadGameFromRow(row: ChessRow): ChessGame {
  // Rebuild game and history from stored moves to preserve turn/state
  const chess = new Chess();
  for (const move of row.moves) {
    const applied = chess.move(move);
    if (!applied) {
      throw new Error(`Stored move ${move} is invalid for game ${row.id}`);
    }
  }
  games.set(row.id, chess);
  gameMetadata.set(row.id, { players: row.players as PlayerMap });

  return {
    id: row.id,
    fen: chess.fen(),
    status: statusFromChess(chess),
    turn: chess.turn(),
    players: row.players as PlayerMap,
    moves: chess.history(),
  };
}

export function applyMoveToGame(id: string, move: { from: string; to: string; promotion?: string }): ChessGame | null {
  const chess = games.get(id);
  const meta = gameMetadata.get(id);
  if (!chess || !meta) return null;

  const result = chess.move({ from: move.from, to: move.to, promotion: move.promotion });
  if (!result) {
    return null;
  }

  return {
    id,
    fen: chess.fen(),
    status: statusFromChess(chess),
    turn: chess.turn(),
    players: meta.players,
    moves: chess.history(),
  };
}
