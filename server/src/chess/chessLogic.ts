import { randomUUID } from "crypto";
import { Chess } from "chess.js";
import type { ChessGame, CreateGameRequest, OpponentType, PlayerColor, PlayerMap } from "./chessTypes.js";

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
