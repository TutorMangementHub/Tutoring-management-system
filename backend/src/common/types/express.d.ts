import type { Role } from "../../config/constants.js";

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
}

export interface ValidatedRequest {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`. */
      user?: AuthUser;
      /** Set by `validate`; handlers should read parsed input from here. */
      validated?: ValidatedRequest;
      /** Correlation id, also echoed in the `x-request-id` response header. */
      requestId?: string;
    }
  }
}

export {};
