import "dotenv/config";
import express, { type Request } from "express";
import type { ServerResponse } from "node:http";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pinoHttp = require("pino-http");
import authRoutes from "./routes/auth.routes.js";
import hospitalsRoutes from "./routes/hospitals.routes.js";
import ambulancesRoutes from "./routes/ambulances.routes.js";
import emergenciesRoutes from "./routes/emergencies.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import { authenticate } from "./middleware/auth.middleware.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { env } from "./config/env.js";
import { getDb } from "./db/client.js";
import { logger } from "./utils/logger.js";

const allowedOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (env.NODE_ENV === "production" && allowedOrigins.includes("*")) {
  throw new Error("CORS_ORIGINS must not contain '*' in production");
}

export const app = express();

if (env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    redact: ["req.headers.authorization", "req.headers.cookie"],
    serializers: {
      req: (req: Request) => ({
        method: req.method,
        url: req.url,
        requestId: (req as Request & { requestId?: string }).requestId,
        headers: req.headers,
      }),
      res: (res: ServerResponse) => ({
        statusCode: res.statusCode,
        headers: res.getHeaders ? res.getHeaders() : {},
      }),
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/ready", (_request, response) => {
  try {
    getDb().prepare("SELECT 1").get();
    response.json({ status: "ready" });
  } catch {
    response.status(503).json({ status: "not-ready" });
  }
});

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/hospitals", authenticate, hospitalsRoutes);
app.use("/api/ambulances", authenticate, ambulancesRoutes);
app.use("/api/emergencies", authenticate, emergenciesRoutes);
app.use("/api/dispatch", authenticate, dispatchRoutes);
app.use("/api/activity", authenticate, activityRoutes);
app.use("/api/metrics", authenticate, metricsRoutes);

app.use((_request, response) => {
  response.status(404).json({ message: "Not found" });
});

app.use(
  (
    error: Error,
    request: Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error(
      {
        err: error,
        requestId: (request as Request & { requestId?: string }).requestId,
      },
      "Internal server error",
    );
    response.status(500).json({ message: "Internal server error" });
  },
);
