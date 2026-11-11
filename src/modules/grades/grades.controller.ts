import type { Request, Response } from "express";
import { AppError } from "../../common/errors/index.js";

/**
 * grades controllers.
 *
 * Handlers stay thin: validate input (see grades.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** GET / — List grade levels with their stage. */
export function listGrades(_req: Request, _res: Response): void {
  throw AppError.notImplemented("List grade levels with their stage");
}

/** GET /:id/availability — Heatmap: how many students are free per hour for a grade. */
export function getAvailability(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Heatmap: how many students are free per hour for a grade");
}
