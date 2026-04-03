import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured before starting the API");
}

export const authService = {
  login(email: string, password: string) {
    const user = userModel.findByEmail(email.trim().toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return null;
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "12h" },
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
    return jwt.verify(token, JWT_SECRET) as unknown as {
      sub: number;
      role: "admin" | "dispatcher";
      email: string;
    };
  },

  signup(email: string, password: string, fullName: string, role: string) {
    const existing = userModel.findByEmail(email.trim().toLowerCase());
    if (existing) {
      return null; // Or throw error
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = userModel.create(email.trim().toLowerCase(), passwordHash, fullName, role);

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "12h" },
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
