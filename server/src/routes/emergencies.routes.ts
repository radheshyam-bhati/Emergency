import { Router } from "express";
import { emergenciesController } from "../controllers/emergencies.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", emergenciesController.list);
router.post("/", requireRole("admin", "dispatcher"), emergenciesController.create);
router.post("/create-and-assign", requireRole("admin", "dispatcher"), emergenciesController.createAndAssign);

export default router;
