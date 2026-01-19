import { nanoid } from "nanoid";
import { Chess } from "chess.js";
import type { ChessGame, CreateGameRequest, GameStatus, OpponentType, PlayerColor, PlayerMap } from "./chessTypes.js";
import type { Chess as ChessRow } from "../db/schema.js";

const games = new Map<string, Chess>();
const gameMetadata = new Map<string, { players: PlayerMap; opponentType: OpponentType }>();

function pickColor(requested: PlayerColor): "white" | "black" {
  if (requested === "random") {
    return Math.random() < 0.5 ? "white" : "black";
  }
  return requested;
}

function buildPlayers(userName: string, opponentType: OpponentType, color: "white" | "black", opponentName?: string): PlayerMap {
  const opponentDisplay = opponentType === "computer" ? "computer" : opponentName || "human";
  return color === "white"
    ? { white: userName, black: opponentDisplay }
    : { white: opponentDisplay, black: userName };
}

export function createGame(params: { userId: string; userName: string } & CreateGameRequest): ChessGame {
  const color = pickColor(params.playerColor);
  const id = nanoid(8);
  const chess = new Chess(); // start position
  const players = buildPlayers(params.userName, params.opponentType, color, params.opponentName);

  games.set(id, chess);
  gameMetadata.set(id, { players, opponentType: params.opponentType });

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
  gameMetadata.set(row.id, { players: row.players as PlayerMap, opponentType: row.opponentType as OpponentType });

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

  try {
    const result = chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    if (!result) {
      return null;
    }
  } catch (_err) {
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

function getComputerColor(players: PlayerMap): "white" | "black" | null {
  if (players.white === "computer") return "white";
  if (players.black === "computer") return "black";
  return null;
}

export function applyMoveAndMaybeComputer(id: string, move: { from: string; to: string; promotion?: string }): ChessGame | null {
  const chess = games.get(id);
  const meta = gameMetadata.get(id);
  if (!chess || !meta) return null;

  try {
    const applied = chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    if (!applied) {
      return null;
    }
  } catch (_err) {
    return null;
  }

  const statusAfterPlayer = statusFromChess(chess);
  const computerColor = meta.opponentType === "computer" ? getComputerColor(meta.players) : null;
  if (statusAfterPlayer === "ongoing" && computerColor && chess.turn() === (computerColor === "white" ? "w" : "b")) {
    const legal = chess.moves({ verbose: true });
    if (legal.length > 0) {
      const choice = legal[Math.floor(Math.random() * legal.length)];
      try {
        chess.move(choice);
      } catch (_err) {
        // ignore if random move fails
      }
    }
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
