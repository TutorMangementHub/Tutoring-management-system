/**
 * Weekly free slots per group: replace a whole day, copy days, merge overlaps, and report conflicts with planned sessions. Mounted under /groups.
 *
 * Mounted at `/groups`.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import * as controller from "./timetables.controller.js";

export const timetableRoutes = Router();

timetableRoutes.use(requireAuth);

/** View a group's weekly free slots */
timetableRoutes.get("/:id/timetable", controller.getTimetable);

/** Replace all free slots for one weekday */
timetableRoutes.put("/:id/timetable/:day", requireRole("teacher"), controller.replaceDay);

/** Copy one day's slots to other days or another group */
timetableRoutes.post("/:id/timetable/copy", requireRole("teacher"), controller.copyDay);
