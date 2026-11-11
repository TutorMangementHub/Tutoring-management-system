/**
 * Group activation, student counts and join codes. Deactivation is soft and requires confirmation when sessions exist.
 *
 * Mounted at `/groups`.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../common/middleware/auth.js";
import * as controller from "../controllers/groups.controller.js";

export const groupsRoutes = Router();

groupsRoutes.use(requireAuth);

/** List groups, optionally only the active ones */
groupsRoutes.get("/", controller.listGroups);

/** Activate/deactivate a group or change its student count */
groupsRoutes.patch("/:id", requireRole("teacher"), controller.updateGroup);

/** Replace a group's join code */
groupsRoutes.post("/:id/join-code/regenerate", requireRole("teacher"), controller.regenerateJoinCode);
