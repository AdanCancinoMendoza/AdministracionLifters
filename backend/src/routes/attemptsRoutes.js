// backend/src/routes/attemptsRoutes.js
import express from "express";
import {
  upsertWeightHandler,
  createAttemptHandler,
  approveAttemptHandler,
  getAttemptsByCompetitorHandler
} from "../controllers/attemptsController.js";

const router = express.Router();

router.post("/upsert-weight", upsertWeightHandler);
router.post("/create", createAttemptHandler);
router.patch("/:id/approve", approveAttemptHandler);
router.get("/by-competitor", getAttemptsByCompetitorHandler);

export default router;
