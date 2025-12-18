import { db } from "../index.js";
import { NewUser, users, User } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(values: { email: string; hashedPassword: string }): Promise<User> {
  const [row] = await db
    .insert(users)
    .values(values)
    .onConflictDoNothing()
    .returning();
  return row;
}

export async function getUserByEmail(email: string): Promise<User> {
  const [u] = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
  return u;
}

export async function getUserById(id: string): Promise<User> {
  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return u;
}

export async function deleteAllUsers() {
  await db.delete(users);
}

export async function updateUserCredentials(
  userId: string,
  args: { email: string; hashedPassword: string }
): Promise<User> {
  const now = new Date();
  const [row] = await db
    .update(users)
    .set({ email: args.email, hashedPassword: args.hashedPassword, updatedAt: now })
    .where(eq(users.id, userId))
    .returning();
  return row; 
}

export async function upgradeUserToChirpyRed(userId: string): Promise<User> {
  const now = new Date();
  const [row] = await db
    .update(users)
    .set({ isChirpyRed: true, updatedAt: now})
    .where(eq(users.id, userId))
    .returning();
  return row;
}

export async function listUsernames(): Promise<Array<Pick<User, "id" | "email">>> {
  const rows = await db.select({ id: users.id, email: users.email }).from(users);
  return rows;
}
