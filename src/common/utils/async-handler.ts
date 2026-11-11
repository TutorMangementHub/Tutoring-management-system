import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async handler so rejected promises reach the error middleware.
 * Express 5 does this natively, but keeping the helper makes the intent
 * explicit and keeps handlers safe if they are ever reused elsewhere.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
