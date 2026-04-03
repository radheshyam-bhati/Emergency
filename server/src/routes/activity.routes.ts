import { Router } from "express";
import { activityController } from "../controllers/activity.controller.js";

const router = Router();

router.get("/", activityController.list);

export default router;
