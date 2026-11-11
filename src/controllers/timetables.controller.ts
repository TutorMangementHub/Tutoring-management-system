import type { Request, Response } from "express";
import { AppError } from "../common/errors/index.js";

/**
 * timetables controllers.
 *
 * Handlers stay thin: validate input (see ../schemas/timetables.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** GET /:id/timetable — View a group's weekly free slots. */
export function getTimetable(_req: Request, _res: Response): void {
  throw AppError.notImplemented("View a group's weekly free slots");
}

/** PUT /:id/timetable/:day — Replace all free slots for one weekday. */
export function replaceDay(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Replace all free slots for one weekday");
}

/** POST /:id/timetable/copy — Copy one day's slots to other days or another group. */
export function copyDay(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Copy one day's slots to other days or another group");
}
