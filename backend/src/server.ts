import { createApp } from "./app.js";
import { closeDatabase } from "./db/client.js";
import { logger } from "./common/utils/logger.js";
import { env } from "./config/env.js";
import { startScheduler, stopScheduler } from "./jobs/scheduler.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, timeZone: env.CENTER_TIMEZONE },
    "Center Sessions API listening",
  );
  startScheduler();
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down");
  stopScheduler();

  server.close(async (error) => {
    if (error) {
      logger.error({ err: error }, "Error while closing the HTTP server");
      process.exitCode = 1;
    }
    try {
      await closeDatabase();
    } catch (dbError) {
      logger.error({ err: dbError }, "Error while closing the database pool");
      process.exitCode = 1;
    }
    process.exit();
  });

  // Do not hang forever on keep-alive connections.
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});
