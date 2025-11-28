import { db } from "../index.js";
import { refreshTokens, users } from "../schema.js";
import { eq } from "drizzle-orm";

export async function insertRefreshToken(values: {
  token: string;
  userId: string;
  expiresAt: Date;
}) {
  const [row] = await db.insert(refreshTokens).values(values).returning();
  return row;
}

export async function findRefreshTokenWithUser(tokenString: string) {
  const [row] = await db
    .select({
      token: refreshTokens,
      user: users,
    })
    .from(refreshTokens)
    .innerJoin(users, eq(refreshTokens.userId, users.id))
    .where(eq(refreshTokens.token, tokenString))
    .limit(1);
  return row; // { token, user } or undefined
}

export async function revokeRefreshToken(tokenString: string) {
  const now = new Date();
  await db
    .update(refreshTokens)
    .set({ revokedAt: now, updatedAt: now })
    .where(eq(refreshTokens.token, tokenString))
    .returning();
}