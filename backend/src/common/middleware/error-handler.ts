import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-codes.js";
import { logger } from "../utils/logger.js";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    hint?: string;
    details?: unknown[];
    meta?: Record<string, unknown>;
    requestId?: string;
  };
}

function send(res: Parameters<ErrorRequestHandler>[2], status: number, body: ErrorBody) {
  res.status(status).json(body);
}

/**
 * Single place that turns any thrown value into the documented error shape.
 * Stack traces and driver messages never reach the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    send(res, 422, {
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Some of the information you entered is not valid.",
        hint: "Check the highlighted fields and try again.",
        details: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
        requestId,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    // Expected business errors: log at warn, without a stack for 4xx.
    req.log?.warn({ code: err.code, status: err.status }, err.message);
    send(res, err.status, {
      error: {
        code: err.code,
        message: err.message,
        ...(err.hint ? { hint: err.hint } : {}),
        ...(err.details ? { details: err.details } : {}),
        ...(err.meta ? { meta: err.meta } : {}),
        requestId,
      },
    });
    return;
  }

  // body-parser / express built-in errors
  if (
    err &&
    typeof err === "object" &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  ) {
    send(res, 400, {
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "The request body is not valid JSON.",
        requestId,
      },
    });
    return;
  }

  logger.error({ err, requestId }, "Unhandled error");

  send(res, 500, {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Something went wrong on our side. Please try again.",
      hint: "If the problem keeps happening, contact the center administrator.",
      requestId,
    },
  });
};
