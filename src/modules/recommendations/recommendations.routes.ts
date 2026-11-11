/**
 * Read-only recommendation search. Loads data, calls the pure engine, and maps the result to the API shape. Persists nothing.
 *
 * Mounted at `/recommendations`.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import * as controller from "./recommendations.controller.js";

export const recommendationRoutes = Router();

recommendationRoutes.use(requireAuth);
recommendationRoutes.use(requireRole("teacher"));

/** Ranked windows plus a coverage plan for a week */
recommendationRoutes.post("/", controller.recommend);
