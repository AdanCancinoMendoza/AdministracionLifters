// backend/src/routes/modulesRoutes.js
import express from "express";
import {
  createModuleHandler,
  assignCompetitorHandler,
  getAssignmentsHandler,
  startModuleHandler,
  getNextParticipantHandler,
  getModulesHandler // <- añadir aquí
} from "../controllers/modulesController.js";

const router = express.Router();

router.get("/", getModulesHandler); 
router.post("/", createModuleHandler);
router.post("/:id/assign", assignCompetitorHandler);
router.get("/:id/assignments", getAssignmentsHandler);
router.post("/:id/start", startModuleHandler);
router.get("/:id/next", getNextParticipantHandler);

export default router;
