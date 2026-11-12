import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { ErrorCode } from "../errors/error-codes.js";

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: `No endpoint matches ${req.method} ${req.originalUrl}.`,
      hint: "Check the API documentation for the correct path.",
    }),
  );
};
