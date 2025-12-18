export type OpponentType = "computer" | "human";
export type PlayerColor = "white" | "black" | "random";
export type GameStatus = "ongoing" | "checkmate" | "draw" | "resigned";
export type Turn = "w" | "b";

export type CreateGameRequest = {
  opponentType: OpponentType;
  playerColor: PlayerColor;
  opponentName?: string;
};

export type PlayerMap = {
  white: string;
  black: string;
};

export type ChessGame = {
  id: string;
  fen: string;
  status: GameStatus;
  turn: Turn;
  players: PlayerMap;
  moves: string[];
};
