import express from "express";
import * as attemptsController from "../controllers/attemptsController.js";
import { postVoteHandler } from "../controllers/votesController.js";
const router = express.Router();

router.post("/upsert-weight", attemptsController.upsertWeightHandler);
router.post("/create", attemptsController.createAttemptHandler);
router.post("/reset", attemptsController.resetAttemptsHandler); 
router.patch("/:id/approve", attemptsController.approveAttemptHandler);
router.get("/by-competitor", attemptsController.getAttemptsByCompetitorHandler);
router.post("/competencias/:id/calificaciones", postVoteHandler);

export default router;
