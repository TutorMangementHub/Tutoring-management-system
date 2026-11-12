import type { RequestHandler } from "express";
import type { ZodType } from "zod";

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Parses and replaces request input with typed, normalized values.
 * Handlers must read from `req.validated` instead of `req.body` / `req.query`,
 * because Express 5 exposes `req.query` as a getter.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    const validated: NonNullable<typeof req.validated> = {};

    if (schemas.params) validated.params = schemas.params.parse(req.params);
    if (schemas.query) validated.query = schemas.query.parse(req.query);
    if (schemas.body) validated.body = schemas.body.parse(req.body);

    req.validated = validated;
    next();
  };
}
