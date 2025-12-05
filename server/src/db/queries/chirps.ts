import { db } from "../index.js";
//import { chirps } from "../schema.js";
import { asc, eq, and } from "drizzle-orm";

/*export async function createChirp(values: { body: string; userId: string }) {
  const [row] = await db.insert(chirps).values(values).returning();
  return row; // { id, createdAt, updatedAt, body, userId }
}*/

/*export async function listChirpsAscending() {
  // Returns: [{ id, createdAt, updatedAt, body, userId }, ...] ordered by createdAt ASC
  return db.select().from(chirps).orderBy(asc(chirps.createdAt));
}*/

/*export async function getChirpById(id: string) {
  const [row] = await db.select().from(chirps).where(eq(chirps.id, id)).limit(1);
  return row; 
}*/

/*export async function getChirpsByUser(user: string) {
  return db.select().from(chirps).where(eq(chirps.userId, user)).orderBy(asc(chirps.createdAt));
}*/

/*export async function deleteChirpOwnedByUser(id: string, userId: string) {
  const [row] = await db
    .delete(chirps)
    .where(and(eq(chirps.id, id), eq(chirps.userId, userId)))
    .returning();
  return row; 
}*/