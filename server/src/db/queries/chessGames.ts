import { db } from "../index.js";
import { chess, type NewChess, type Chess } from "../schema.js";
import { eq } from "drizzle-orm";

export async function insertChessGame(values: NewChess): Promise<Chess> {
  const [row] = await db.insert(chess).values(values).returning();
  return row;
}

export async function getChessGameById(id: string): Promise<Chess | undefined> {
  const [row] = await db.select().from(chess).where(eq(chess.id, id)).limit(1);
  return row;
}

export async function updateChessGame(id: string, values: Partial<NewChess>): Promise<Chess | undefined> {
  const [row] = await db
    .update(chess)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(chess.id, id))
    .returning();
  return row;
}
