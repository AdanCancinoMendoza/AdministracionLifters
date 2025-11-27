// backend/src/routes/modules.js
import express from "express";
import * as modulesController from "../controllers/modulesController.js";
const router = express.Router();

router.post("/", modulesController.createModuleHandler);
router.get("/", modulesController.getModulesHandler);

router.get("/:id/assignments", modulesController.getAssignmentsHandler);
router.post("/:id/assign", modulesController.assignCompetitorHandler);
router.delete("/:id/assign/:competitorId", modulesController.removeAssignmentHandler);

router.post("/:id/start", modulesController.startModuleHandler);
router.delete("/:id", modulesController.deleteModuleHandler);
router.get("/:id/next", modulesController.getNextParticipantHandler);

router.post("/:id/select", modulesController.selectParticipantHandler);
router.post("/:id/select-competitor", modulesController.selectCompetitorHandler);

// RUTAS NUEVAS PARA CONTROL DE TIMER / BLOQUE
router.post("/:id/resume", modulesController.resumeModuleHandler);
router.post("/:id/pause", modulesController.pauseModuleHandler);
router.post("/:id/reset", modulesController.resetModuleHandler);
router.post("/:id/stop", modulesController.stopModuleHandler);
router.post("/:id/end", modulesController.endModuleHandler);

export default router;
