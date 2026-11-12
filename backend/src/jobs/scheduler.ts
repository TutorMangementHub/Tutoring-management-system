import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../common/utils/logger.js";
import { autoCancelNeverStarted, autoFinishStaleSessions } from "./auto-transitions.js";

let task: ScheduledTask | null = null;

/**
 * Scheduler entry point. Runs every 5 minutes; both jobs are idempotent and
 * safe to run concurrently with the API.
 */
export function startScheduler(): void {
  if (task) return;

  task = cron.schedule("*/5 * * * *", async () => {
    try {
      const finished = await autoFinishStaleSessions();
      const cancelled = await autoCancelNeverStarted();
      if (finished || cancelled) {
        logger.info({ finished, cancelled }, "Automatic session transitions applied");
      }
    } catch (error) {
      logger.error({ err: error }, "Scheduler run failed");
    }
  });

  logger.info("Session scheduler started (every 5 minutes)");
}

export function stopScheduler(): void {
  task?.stop();
  task = null;
}
