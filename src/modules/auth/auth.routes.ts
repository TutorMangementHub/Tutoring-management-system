/**
 * Authentication: password login, refresh-token rotation, logout, and student self-registration with a join code.
 *
 * Mounted at `/auth`.
 */
import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { authLimiter, registrationLimiter } from "../../common/middleware/rate-limit.js";
import * as controller from "./auth.controller.js";

export const authRoutes = Router();

/** Log in with email and password */
authRoutes.post("/login", authLimiter, controller.login);

/** Rotate the refresh token and issue a new access token */
authRoutes.post("/refresh", authLimiter, controller.refresh);

/** Revoke the current refresh token */
authRoutes.post("/logout", requireAuth, controller.logout);

/** Register a student account using a group join code */
authRoutes.post("/register-student", registrationLimiter, controller.registerStudent);
