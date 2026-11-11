import type { Request, Response } from "express";
import { AppError } from "../common/errors/index.js";

/**
 * sessions controllers.
 *
 * Handlers stay thin: validate input (see ../schemas/sessions.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** GET /sessions — List sessions with status/grade/date filters. */
export function listSessions(_req: Request, _res: Response): void {
  throw AppError.notImplemented("List sessions with status/grade/date filters");
}

/** POST /sessions — Create a session from a recommendation or a manual override. */
export function createSession(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Create a session from a recommendation or a manual override");
}

/** PATCH /sessions/:id — Edit topic, notes or time of a planned session. */
export function updateSession(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Edit topic, notes or time of a planned session");
}

/** POST /sessions/:id/start — Mark a planned session as started. */
export function startSession(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Mark a planned session as started");
}

/** POST /sessions/:id/finish — Mark a started session as finished. */
export function finishSession(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Mark a started session as finished");
}

/** POST /sessions/:id/postpone — Postpone a planned session (reason required). */
export function postponeSession(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Postpone a planned session (reason required)");
}

/** POST /sessions/:id/reschedule — Move a postponed session to a new date and time. */
export function rescheduleSession(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Move a postponed session to a new date and time");
}

/** POST /sessions/:id/cancel — Cancel a session (reason required). */
export function cancelSession(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Cancel a session (reason required)");
}

/** GET /me/sessions — Upcoming sessions for the signed-in student's group. */
export function listMySessions(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Upcoming sessions for the signed-in student's group");
}
