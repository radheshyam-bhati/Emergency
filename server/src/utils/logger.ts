import pino from "pino";
import type { Request, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
  redact: ["req.headers.authorization", "req.headers.cookie"],
  serializers: {
    req: (req: Request) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders ? res.getHeaders() : {},
    }),
  },
});

export default logger;
