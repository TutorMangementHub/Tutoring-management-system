/**
 * The school-wide grade catalogue (7th, 8th, ... with stage) and the per-grade availability heatmap.
 *
 * Mounted at `/grades`.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../common/middleware/auth.js";
import * as controller from "../controllers/grades.controller.js";

export const gradesRoutes = Router();

gradesRoutes.use(requireAuth);

/** List grade levels with their stage */
gradesRoutes.get("/", controller.listGrades);

/** Heatmap: how many students are free per hour for a grade */
gradesRoutes.get("/:id/availability", requireRole("teacher"), controller.getAvailability);
