import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    fileParallelism: false,
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "server/src/**/*.{test,spec}.{ts,tsx}"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-only-secret-for-ci-minimum-32-characters",
      DATABASE_PATH: path.join(os.tmpdir(), `rapid-rescue-test-${process.pid}.db`),
      DEMO_ADMIN_EMAIL: "admin@example.com",
      DEMO_ADMIN_PASSWORD: "test-admin-password",
      DEMO_DISPATCHER_EMAIL: "dispatcher@example.com",
      DEMO_DISPATCHER_PASSWORD: "test-dispatcher-password",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
