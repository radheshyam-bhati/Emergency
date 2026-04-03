import { Router } from "express";
import { ambulancesController } from "../controllers/ambulances.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", ambulancesController.list);
router.patch("/:id/status", requireRole("admin", "dispatcher"), ambulancesController.updateStatus);

export default router;
