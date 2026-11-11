import type { Request, Response } from "express";
import { AppError } from "../../common/errors/index.js";

/**
 * auth controllers.
 *
 * Handlers stay thin: validate input (see auth.schema.ts), call the
 * service, and shape the response. Business rules belong in the service.
 */

/** POST /login — Log in with email and password. */
export function login(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Log in with email and password");
}

/** POST /refresh — Rotate the refresh token and issue a new access token. */
export function refresh(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Rotate the refresh token and issue a new access token");
}

/** POST /logout — Revoke the current refresh token. */
export function logout(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Revoke the current refresh token");
}

/** POST /register-student — Register a student account using a group join code. */
export function registerStudent(_req: Request, _res: Response): void {
  throw AppError.notImplemented("Register a student account using a group join code");
}
