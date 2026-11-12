import rateLimit from "express-rate-limit";
import { isTest } from "../../config/env.js";
import { ErrorCode } from "../errors/error-codes.js";

const base = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    error: {
      code: ErrorCode.RATE_LIMITED,
      message: "Too many attempts. Please wait a few minutes and try again.",
    },
  },
};

/** Login and refresh: slow down password guessing. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

/** Student self-registration: slow down join-code guessing. */
export const registrationLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

/** Broad protection for the rest of the API. */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 300,
});
