import { ErrorCode } from "./error-codes.js";

export interface ErrorDetail {
  field?: string;
  message?: string;
  [key: string]: unknown;
}

export interface AppErrorOptions {
  /** HTTP status code. */
  status: number;
  code: ErrorCode | string;
  /** Plain-language, user-facing message. Never a stack trace. */
  message: string;
  /** Optional actionable next step for the user. */
  hint?: string;
  /** Field-level details for form UIs. */
  details?: ErrorDetail[];
  /** Extra machine-readable data (ids, affected sessions, ...). */
  meta?: Record<string, unknown>;
  /** Underlying error, logged but never sent to the client. */
  cause?: unknown;
}

/**
 * The only error type application code should throw. The error middleware
 * turns it into the single documented JSON shape.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly hint?: string;
  readonly details?: ErrorDetail[];
  readonly meta?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "AppError";
    this.status = options.status;
    this.code = options.code;
    this.hint = options.hint;
    this.details = options.details;
    this.meta = options.meta;
  }

  static badRequest(code: string, message: string, options: Partial<AppErrorOptions> = {}) {
    return new AppError({ status: 400, code, message, ...options });
  }

  static unauthorized(
    message = "Please sign in to continue.",
    code: string = ErrorCode.UNAUTHORIZED,
  ) {
    return new AppError({ status: 401, code, message });
  }

  static forbidden(message = "You are not allowed to do this.") {
    return new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message });
  }

  static notFound(message = "The requested item was not found.", code = ErrorCode.NOT_FOUND) {
    return new AppError({ status: 404, code, message });
  }

  static conflict(
    code: string,
    message: string,
    options: Partial<AppErrorOptions> = {},
  ) {
    return new AppError({ status: 409, code, message, ...options });
  }

  static unprocessable(code: string, message: string, options: Partial<AppErrorOptions> = {}) {
    return new AppError({ status: 422, code, message, ...options });
  }

  static notImplemented(feature: string) {
    return new AppError({
      status: 501,
      code: ErrorCode.NOT_IMPLEMENTED,
      message: `${feature} is not implemented yet.`,
      hint: "This endpoint is part of the planned scope and will be added in a later milestone.",
    });
  }
}
