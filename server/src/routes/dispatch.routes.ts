import { Router } from "express";
import { dispatchController } from "../controllers/dispatch.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/preview", requireRole("admin", "dispatcher"), dispatchController.preview);
router.get("/:emergencyId", dispatchController.detail);
router.post("/:emergencyId/assign", requireRole("admin", "dispatcher"), dispatchController.assign);

export default router;
