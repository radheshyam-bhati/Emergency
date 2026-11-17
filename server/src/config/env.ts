import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  DATABASE_PATH: z.string().min(1).optional(),
  CORS_ORIGINS: z.string().default("http://localhost:8080"),
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
  SEED_DEMO_DATA: z.enum(["true", "false"]).default("false"),
  DEMO_ADMIN_EMAIL: z.string().email().optional(),
  DEMO_ADMIN_PASSWORD: z.string().min(8).optional(),
  DEMO_DISPATCHER_EMAIL: z.string().email().optional(),
  DEMO_DISPATCHER_PASSWORD: z.string().min(8).optional(),
});

export const env = envSchema.parse(process.env);
