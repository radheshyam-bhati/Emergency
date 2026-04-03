import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { userModel } from "../models/user.model.js";

export const authenticate = (request: Request, response: Response, next: NextFunction) => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Missing authorization token" });
  }

  try {
    const decoded = authService.verify(header.replace("Bearer ", ""));
    const user = userModel.findById(decoded.sub);

    if (!user) {
      return response.status(401).json({ message: "Invalid token" });
    }

    request.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole =
  (...roles: Array<"admin" | "dispatcher">) =>
  (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ message: "Forbidden" });
    }

    next();
  };
