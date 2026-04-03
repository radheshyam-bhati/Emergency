import type { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service.js";
import { userModel } from "../models/user.model.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(["admin", "dispatcher"]),
});

export const authController = {
  signup(request: Request, response: Response) {
    const result = signupSchema.safeParse(request.body);

    if (!result.success) {
      return response.status(400).json({ message: "Invalid signup payload" });
    }

    const session = authService.signup(
      result.data.email,
      result.data.password,
      result.data.fullName,
      result.data.role
    );

    if (!session) {
      return response.status(400).json({ message: "Email already in use" });
    }

    return response.json(session);
  },

  login(request: Request, response: Response) {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
      return response.status(400).json({ message: "Invalid login payload" });
    }

    const session = authService.login(result.data.email, result.data.password);

    if (!session) {
      return response.status(401).json({ message: "Invalid credentials" });
    }

    return response.json(session);
  },

  me(request: Request, response: Response) {
    if (!request.user) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const user = userModel.findById(request.user.id);

    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    return response.json({ user });
  },
};
