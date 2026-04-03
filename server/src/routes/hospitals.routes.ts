import { Router } from "express";
import { hospitalsController } from "../controllers/hospitals.controller.js";

const router = Router();

router.get("/", hospitalsController.list);
router.get("/:id", hospitalsController.detail);

export default router;
