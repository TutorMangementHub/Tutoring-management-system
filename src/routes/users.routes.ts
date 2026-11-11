/**
 * Admin management of teacher accounts: create, list, deactivate and reset passwords. Never hard-deletes a user.
 *
 * Mounted at `/users`.
 */
import { Router } from "express";
import { requireAuth, requireRole } from "../common/middleware/auth.js";
import * as controller from "../controllers/users.controller.js";

export const usersRoutes = Router();

usersRoutes.use(requireAuth);
usersRoutes.use(requireRole("admin"));

/** List users, optionally filtered by role or active state */
usersRoutes.get("/", controller.listUsers);

/** Create a teacher account */
usersRoutes.post("/", controller.createTeacher);

/** Rename, deactivate or reactivate a user */
usersRoutes.patch("/:id", controller.updateUser);

/** Set a new temporary password for a teacher */
usersRoutes.post("/:id/reset-password", controller.resetPassword);
