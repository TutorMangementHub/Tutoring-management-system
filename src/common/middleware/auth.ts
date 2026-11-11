import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { Role } from "../../config/constants.js";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-codes.js";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

/** Requires a valid `Authorization: Bearer <access token>` header. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(AppError.unauthorized());
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (error) {
    const expired = error instanceof jwt.TokenExpiredError;
    next(
      AppError.unauthorized(
        expired ? "Your session has expired. Please sign in again." : "Your session is not valid.",
        expired ? ErrorCode.TOKEN_EXPIRED : ErrorCode.TOKEN_INVALID,
      ),
    );
  }
};

/** Must run after `requireAuth`. Admins are allowed everywhere. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (req.user.role !== "admin" && !roles.includes(req.user.role)) {
      next(AppError.forbidden("Your account is not allowed to perform this action."));
      return;
    }
    next();
  };
}
