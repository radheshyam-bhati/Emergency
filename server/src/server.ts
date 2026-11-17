import { app } from "./app.js";
import { getDb } from "./db/client.js";
import { operationsService } from "./services/operations.service.js";
import { env } from "./config/env.js";

getDb();

if (env.NODE_ENV !== "production" && env.SEED_DEMO_DATA === "true") {
  const { seedDatabase } = await import("./db/seed.js");
  seedDatabase();
}

operationsService.startLifecycleLoop();

const server = app.listen(env.API_PORT, () => {
  console.log(`Rapid Rescue Grid API running on http://localhost:${env.API_PORT}`);
});

let shuttingDown = false;

const shutdown = (signal: string) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}; shutting down`);

  operationsService.stopLifecycleLoop();

  server.close(() => {
    try {
      getDb().close();
    } catch {
      // The database may already be closed during a failed startup.
    }

    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
