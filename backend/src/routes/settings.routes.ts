/**
 * The center-wide configuration singleton: opening hours, operating days, closed dates, buffers, durations and capacity.
 *
 * Mounted at `/settings`.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../common/middleware/auth.js";
import * as controller from "../controllers/settings.controller.js";

export const settingsRoutes = Router();

settingsRoutes.use(requireAuth);
settingsRoutes.use(requireRole("admin"));

/** Read the current center settings */
settingsRoutes.get("/", controller.getSettings);

/** Update center settings */
settingsRoutes.patch("/", controller.updateSettings);
