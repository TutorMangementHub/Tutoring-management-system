import type { Request, Response } from "express";
import { AppError } from "../common/errors/index.js";

/**
 * notifications controllers.
 *
 * Handlers stay thin: validate input (see ../schemas/notifications.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** GET /me/notifications — List the signed-in user's notifications. */
export function listMyNotifications(_req: Request, _res: Response): void {
  throw AppError.notImplemented("List the signed-in user's notifications");
}

/** PATCH /me/notifications/:id/read — Mark one notification as read. */
export function markNotificationRead(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Mark one notification as read");
}
