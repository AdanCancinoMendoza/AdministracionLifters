import express from "express";
import {
  crearLiveStreamController,
  obtenerLiveStreamsController,
  obtenerLiveStreamPorIdController,
  actualizarLiveStreamController,
  eliminarLiveStreamController,
  obtenerLiveStreamsActivosController
} from "../controllers/liveStreamController.js";

const router = express.Router();

// Rutas:
// GET    /api/live_streams               -> todos
// GET    /api/live_streams/active        -> solo activos (público)
// GET    /api/live_streams/:id           -> uno
// POST   /api/live_streams               -> crear
// PUT    /api/live_streams/:id           -> actualizar
// DELETE /api/live_streams/:id           -> eliminar

router.get("/", obtenerLiveStreamsController);
router.get("/active", obtenerLiveStreamsActivosController);
router.get("/:id", obtenerLiveStreamPorIdController);
router.post("/", crearLiveStreamController);
router.put("/:id", actualizarLiveStreamController);
router.delete("/:id", eliminarLiveStreamController);

export default router;
