/**
 * In-app notifications only (no email). Created by session changes and by the scheduler; students read their own feed.
 *
 * Mounted at `/`.
 */
import { Router } from "express";
import { requireAuth } from "../common/middleware/auth.js";
import * as controller from "../controllers/notifications.controller.js";

export const notificationRoutes = Router();

/** List the signed-in user's notifications */
notificationRoutes.get("/me/notifications", requireAuth, controller.listMyNotifications);

/** Mark one notification as read */
notificationRoutes.patch("/me/notifications/:id/read", requireAuth, controller.markNotificationRead);
