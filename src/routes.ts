import { Router } from "express";
import { checkDatabase } from "./db/client.js";
import { asyncHandler } from "./common/utils/async-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { gradesRoutes } from "./modules/grades/grades.routes.js";
import { groupsRoutes } from "./modules/groups/groups.routes.js";
import { notificationRoutes } from "./modules/notifications/notifications.routes.js";
import { recommendationRoutes } from "./modules/recommendations/recommendations.routes.js";
import { sessionRoutes } from "./modules/sessions/sessions.routes.js";
import { settingsRoutes } from "./modules/settings/settings.routes.js";
import { timetableRoutes } from "./modules/timetables/timetables.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";

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
