import { db } from "../index.js";
import { chess, type NewChess, type Chess } from "../schema.js";

export async function insertChessGame(values: NewChess): Promise<Chess> {
  const [row] = await db.insert(chess).values(values).returning();
  return row;
}
