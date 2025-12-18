import { db } from "../index.js";
import { chess, type NewChess, type Chess } from "../schema.js";
import { eq, sql, or } from "drizzle-orm";

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

export async function listChessGamesForUserName(userId: string, userName: string): Promise<Chess[]> {
  return db
    .select()
    .from(chess)
    .where(
      or(
        eq(sql`("chess"."players"->>'white')`, userName),
        eq(sql`("chess"."players"->>'black')`, userName),
        eq(chess.createdBy, userId)
      )
    );
}
