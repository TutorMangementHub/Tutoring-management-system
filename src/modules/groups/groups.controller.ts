import type { Request, Response } from "express";
import { AppError } from "../../common/errors/index.js";

/**
 * groups controllers.
 *
 * Handlers stay thin: validate input (see groups.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** GET / — List groups, optionally only the active ones. */
export function listGroups(_req: Request, _res: Response): void {
  throw AppError.notImplemented("List groups, optionally only the active ones");
}

/** PATCH /:id — Activate/deactivate a group or change its student count. */
export function updateGroup(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Activate/deactivate a group or change its student count");
}

/** POST /:id/join-code/regenerate — Replace a group's join code. */
export function regenerateJoinCode(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Replace a group's join code");
}
