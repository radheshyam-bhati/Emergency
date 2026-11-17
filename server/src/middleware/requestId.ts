import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const requestIdMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const headerValue = request.headers["x-request-id"];
  const requestId =
    typeof headerValue === "string"
      ? headerValue
      : Array.isArray(headerValue)
        ? headerValue[0] ?? crypto.randomBytes(16).toString("hex")
        : crypto.randomBytes(16).toString("hex");

  response.setHeader("x-request-id", requestId);
  (request as Request & { requestId?: string }).requestId = requestId;

  next();
};
