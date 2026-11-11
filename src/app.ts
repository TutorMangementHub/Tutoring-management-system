import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { errorHandler } from "./common/middleware/error-handler.js";
import { notFound } from "./common/middleware/not-found.js";
import { apiLimiter } from "./common/middleware/rate-limit.js";
import { requestId } from "./common/middleware/request-id.js";
import { logger } from "./common/utils/logger.js";
import { apiRouter } from "./routes.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) =>
        (req as express.Request).requestId ?? randomUUID(),
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(apiLimiter);

  app.use(apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
