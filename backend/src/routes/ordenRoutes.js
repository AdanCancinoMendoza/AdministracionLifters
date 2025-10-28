// routes/ordenRoutes.js
import express from "express";
import {
  crearOrdenController,
  obtenerOrdenController,
  guardarPesosController,
  controlOrdenController,
  obtenerOrdenConPesosController 

} from "../controllers/ordenController.js";

const router = express.Router();

/**
 * Rutas:
 * POST   /api/competencias/:id/orden           -> crear/replace orden
 * GET    /api/competencias/:id/orden           -> obtener orden
 * POST   /api/competencias/:id/pesos           -> guardar pesos (bulk)
 * PATCH  /api/competencias/:id/orden/:id_competidor/:action  -> start|pause|resume|next
 */

router.post("/:id/orden", crearOrdenController);
router.get("/:id/orden", obtenerOrdenController);
router.post("/:id/pesos", guardarPesosController);
router.patch("/:id/orden/:id_competidor/:action", controlOrdenController);
router.get("/:id/orden_pesos", obtenerOrdenConPesosController);

export default router;
