import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import hospitalsRoutes from "./routes/hospitals.routes.js";
import ambulancesRoutes from "./routes/ambulances.routes.js";
import emergenciesRoutes from "./routes/emergencies.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import { authenticate } from "./middleware/auth.middleware.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/hospitals", authenticate, hospitalsRoutes);
app.use("/api/ambulances", authenticate, ambulancesRoutes);
app.use("/api/emergencies", authenticate, emergenciesRoutes);
app.use("/api/dispatch", authenticate, dispatchRoutes);
app.use("/api/activity", authenticate, activityRoutes);
app.use("/api/metrics", authenticate, metricsRoutes);

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(500).json({ message: error.message || "Internal server error" });
});
