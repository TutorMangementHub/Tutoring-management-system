import type { Request, Response } from "express";
import { AppError } from "../../common/errors/index.js";

/**
 * users controllers.
 *
 * Handlers stay thin: validate input (see users.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** GET / — List users, optionally filtered by role or active state. */
export function listUsers(_req: Request, _res: Response): void {
  throw AppError.notImplemented("List users, optionally filtered by role or active state");
}

/** POST / — Create a teacher account. */
export function createTeacher(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Create a teacher account");
}

/** PATCH /:id — Rename, deactivate or reactivate a user. */
export function updateUser(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Rename, deactivate or reactivate a user");
}

/** POST /:id/reset-password — Set a new temporary password for a teacher. */
export function resetPassword(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Set a new temporary password for a teacher");
}
