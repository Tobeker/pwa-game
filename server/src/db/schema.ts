import { pgTable, timestamp, varchar, uuid, boolean, json, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  email: varchar("email", { length: 256 }).unique().notNull(),
  hashedPassword: varchar("hashed_password", {length: 60}).notNull().default("unset"),
  isChirpyRed: boolean("is_chirpy_red").notNull().default(false),
});

/*export const chirps = pgTable("chirps", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  body: varchar("body", { length: 140}).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
});*/

export const refreshTokens = pgTable("refresh_tokens", {
  token: varchar("token", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
});

export const chess = pgTable("chess", {
  id: varchar("id", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  fen: varchar("fen", { length: 256 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  turn: varchar("turn", { length: 2 }).notNull(),
  opponentType: varchar("opponent_type", { length: 16 }).notNull(),
  playerColor: varchar("player_color", { length: 8 }).notNull(),
  players: json().notNull(),
  moves: text("moves").array().notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewChess = typeof chess.$inferInsert;
export type Chess = typeof chess.$inferSelect;
//export type NewChirp = typeof chirps.$inferInsert;
//export type Chirp = typeof chirps.$inferSelect;
