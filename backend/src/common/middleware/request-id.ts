import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

/**
 * Accepts an upstream `x-request-id` or generates one, echoes it on the
 * response, and exposes it as `req.requestId` for logs and error bodies.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.requestId = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};
