import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model.js";
import { env } from "../config/env.js";

const TOKEN_TTL = "12h";
const BCRYPT_ROUNDS = 12;

export const authService = {
  async login(email: string, password: string) {
    const user = userModel.findByEmail(email.trim().toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: TOKEN_TTL, algorithm: "HS256" },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  },

  verify(token: string) {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as unknown as {
      sub: number;
      role: "admin" | "dispatcher";
      email: string;
    };
  },

  async signup(email: string, password: string, fullName: string, role: "admin" | "dispatcher") {
    const existing = userModel.findByEmail(email.trim().toLowerCase());
    if (existing) {
      return null;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = userModel.create(email.trim().toLowerCase(), passwordHash, fullName, role);

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: TOKEN_TTL, algorithm: "HS256" },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  },
};
