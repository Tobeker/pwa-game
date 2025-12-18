import express from "express";
import { handlerReadiness } from "./api/readiness.js";
import { middlewareLogResponses/*, middlewareMetricsInc*/ } from "./api/middleware.js";
import { 
  handlerCreateUser, 
  //handlerMetrics, 
  handlerReset, 
  //handlerCreateChirp, 
  //handlerListChirps, 
  //handlerGetChirp, 
  handlerLogin,
  handlerRefresh,
  handlerRevoke,
  handlerUpdateUser,
  //handlerDeleteChirp,
  //handlerPolkaWebhooks, 
  handlerListUsernames
} from "./api/handler.js";
import { errorHandler } from "./api/errors.js";
import { config } from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { handlerCreateChessGame, handlerGetChessGame, handlerMakeChessMove, handlerListChessGames } from "./chess/chessHandler.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);


const app = express();
const PORT = 8080;

app.use(express.json())
// app.use("/app",middlewareMetricsInc, express.static("./src/app")); // wenn zugriff auf src/app/html datei, dann wird config.api.fileserverHits+=1 (middleWareMetricsInc)
app.use(middlewareLogResponses); // wenn Statuscode nicht 200, dann wird Statuscode in Console geschrieben
app.get("/api/healthz", handlerReadiness); // Server antwortet mit "OK" wenn er läuft
// app.get("/admin/metrics", handlerMetrics); // sendet anzahl der seitenaufrufe
app.put("/api/users", handlerUpdateUser); // ändert email/name und passwort bei gültigem token
app.post("/api/users", handlerCreateUser); // legt User in db an. braucht email/name und passwort welches hier gehashed wird
app.post("/api/login", handlerLogin); // vergleicht email/name und passwort mit db, erstellt jwtToken und refreshToken, speichert in db und gibt token zurück
app.get("/api/usernames", handlerListUsernames); // listet alle Nutzer (id + email/name)
// passwort-hashing sollte von bcrypt auf argon2 umgestellt werden
app.post("/api/refresh", handlerRefresh); // bearer/refresh-token aus db wird verifiziert und neuer jwtToken erzeugt
app.post("/api/revoke", handlerRevoke); // refresh-Token in db wird schlecht gesetzt /ungültig
app.post("/admin/reset", handlerReset);  // löscht user-db, wenn man "dev" ist (config.platform)
app.post("/api/chess/games", handlerCreateChessGame); // startet ein neues chess.js Spiel
app.get("/api/chess/game/:id", handlerGetChessGame); // gibt den Zustand eines Spiels zurück
app.post("/api/chess/games/:id/moves", handlerMakeChessMove); // macht einen Zug im Spiel
app.get("/api/chessgames", handlerListChessGames); // alle Spiele eines Users
// app.post("/api/chirps", handlerCreateChirp); // neuen chirp nach richtlinien in db eintragen
// app.post("/api/polka/webhooks", handlerPolkaWebhooks); // upgrade zu premium durch polka-bezahldienst
// app.get("/api/chirps", handlerListChirps); // Listet alle chirps
// app.get("/api/chirps/:chirpID", handlerGetChirp); // Listet den Chirp mit der chirpID
// app.delete("/api/chirps/:chirpID", handlerDeleteChirp); // löscht chirp bei gültigem token
app.use(errorHandler); // Errors müssen als letztes behandelt werden

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
