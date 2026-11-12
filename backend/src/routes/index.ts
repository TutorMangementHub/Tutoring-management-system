import { Router } from "express";
import { asyncHandler } from "../common/utils/async-handler.js";
import { checkDatabase } from "../db/client.js";
import { authRoutes } from "./auth.routes.js";
import { gradesRoutes } from "./grades.routes.js";
import { groupsRoutes } from "./groups.routes.js";
import { notificationRoutes } from "./notifications.routes.js";
import { recommendationRoutes } from "./recommendations.routes.js";
import { sessionRoutes } from "./sessions.routes.js";
import { settingsRoutes } from "./settings.routes.js";
import { timetableRoutes } from "./timetables.routes.js";
import { usersRoutes } from "./users.routes.js";

/**
 * Root API router.
 *
 * Only composition happens here: each feature router declares its own paths,
 * guards and controller bindings. `app.ts` mounts this at the API root.
 */
export const apiRouter = Router();

/** Liveness: the process is up. Used by the dev script and uptime checks. */
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
});

/** Readiness: the process can reach PostgreSQL. */
apiRouter.get(
  "/health/ready",
  asyncHandler(async (_req, res) => {
    await checkDatabase();
    res.json({ status: "ready" });
  }),
);

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/grades", gradesRoutes);
apiRouter.use("/groups", groupsRoutes);
apiRouter.use("/groups", timetableRoutes);
apiRouter.use("/recommendations", recommendationRoutes);
apiRouter.use("/settings", settingsRoutes);

// These routers own root-level paths (`/sessions`, `/me/...`).
apiRouter.use(sessionRoutes);
apiRouter.use(notificationRoutes);
