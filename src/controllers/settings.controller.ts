import type { Request, Response } from "express";
import { AppError } from "../common/errors/index.js";

/**
 * settings controllers.
 *
 * Handlers stay thin: validate input (see ../schemas/settings.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** GET / — Read the current center settings. */
export function getSettings(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Read the current center settings");
}

/** PATCH / — Update center settings. */
export function updateSettings(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Update center settings");
}
