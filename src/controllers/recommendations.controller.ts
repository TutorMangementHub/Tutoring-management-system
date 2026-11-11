import type { Request, Response } from "express";
import { AppError } from "../common/errors/index.js";

/**
 * recommendations controllers.
 *
 * Handlers stay thin: validate input (see ../schemas/recommendations.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** POST / — Ranked windows plus a coverage plan for a week. */
export function recommend(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Ranked windows plus a coverage plan for a week");
}
