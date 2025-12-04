process.loadEnvFile();
import type { MigrationConfig } from "drizzle-orm/migrator";

type Config = {
  api: APIConfig;
  db: DBConfig;
};

export type APIConfig = {
    fileserverHits: number;
    port: number;
    platform: string;
    jwtSecret: string;
    polkaKey: string;
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};

export const config: Config = {
  api: {
    fileserverHits: 0,
    port: 8080,
    platform: process.env.PLATFORM ?? "prod",
    jwtSecret: process.env.JWT_SECRET ?? "",
    polkaKey: process.env.POLKA_KEY ?? "",
  },
  db: {
    url: process.env.DB_URL ?? "",
    migrationConfig: migrationConfig,
  },
};