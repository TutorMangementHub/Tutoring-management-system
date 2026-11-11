/**
 * Session creation, editing, lifecycle transitions, status history and optimistic locking. Also exposes the student's own session list.
 *
 * Mounted at `/`.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import * as controller from "./sessions.controller.js";

export const sessionRoutes = Router();

/** List sessions with status/grade/date filters */
sessionRoutes.get("/sessions", requireAuth, requireRole("teacher"), controller.listSessions);

/** Create a session from a recommendation or a manual override */
sessionRoutes.post("/sessions", requireAuth, requireRole("teacher"), controller.createSession);

/** Edit topic, notes or time of a planned session */
sessionRoutes.patch("/sessions/:id", requireAuth, requireRole("teacher"), controller.updateSession);

/** Mark a planned session as started */
sessionRoutes.post("/sessions/:id/start", requireAuth, requireRole("teacher"), controller.startSession);

/** Mark a started session as finished */
sessionRoutes.post("/sessions/:id/finish", requireAuth, requireRole("teacher"), controller.finishSession);

/** Postpone a planned session (reason required) */
sessionRoutes.post("/sessions/:id/postpone", requireAuth, requireRole("teacher"), controller.postponeSession);

/** Move a postponed session to a new date and time */
sessionRoutes.post("/sessions/:id/reschedule", requireAuth, requireRole("teacher"), controller.rescheduleSession);

/** Cancel a session (reason required) */
sessionRoutes.post("/sessions/:id/cancel", requireAuth, requireRole("teacher"), controller.cancelSession);

/** Upcoming sessions for the signed-in student's group */
sessionRoutes.get("/me/sessions", requireAuth, requireRole("student"), controller.listMySessions);
