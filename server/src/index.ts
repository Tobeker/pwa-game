import express from "express";
import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./api/middleware.js";
import { 
  handlerCreateUser, 
  handlerMetrics, 
  handlerReset, 
  handlerCreateChirp, 
  handlerListChirps, 
  handlerGetChirp, 
  handlerLogin,
  handlerRefresh,
  handlerRevoke,
  handlerUpdateUser,
  handlerDeleteChirp,
  handlerPolkaWebhooks } from "./api/handler.js";
import { errorHandler } from "./api/errors.js";
import { config } from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);


const app = express();
const PORT = 8080;

app.use(express.json())
app.use("/app",middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponses);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.put("/api/users", handlerUpdateUser);
app.post("/api/users", handlerCreateUser);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);
app.post("/admin/reset", handlerReset);
app.post("/api/chirps", handlerCreateChirp);
app.post("/api/polka/webhooks", handlerPolkaWebhooks);
app.get("/api/chirps", handlerListChirps);
app.get("/api/chirps/:chirpID", handlerGetChirp);
app.delete("/api/chirps/:chirpID", handlerDeleteChirp);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});