import app from "./app";
import { logger } from "./lib/logger";
import { runScheduledChecks } from "./routes/watchlist.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run scheduled watchlist checks every hour
  setInterval(() => {
    runScheduledChecks().catch((e: unknown) => logger.error({ e }, "Scheduled watchlist check failed"));
  }, 60 * 60 * 1000);

  // Also run once on startup (5 second delay to let DB settle)
  setTimeout(() => {
    runScheduledChecks().catch((e: unknown) => logger.error({ e }, "Startup watchlist check failed"));
  }, 5000);
});
