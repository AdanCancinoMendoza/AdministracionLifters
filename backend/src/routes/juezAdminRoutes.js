import express from "express";
import {
  crearJuezController,
  obtenerJuecesController,
  obtenerJuezController,
  obtenerJuecesPorCompetenciaController,
  actualizarJuezController,
  eliminarJuezController,
} from "../controllers/juezAdminController.js";

const router = express.Router();

// ✅ NUEVA RUTA: Obtener jueces por competencia
router.get("/competencia/:id_competencia/jueces", obtenerJuecesPorCompetenciaController);

// Rutas principales
router.post("/", crearJuezController);        // POST /api/juez
router.get("/", obtenerJuecesController);     // GET /api/juez
router.get("/:id", obtenerJuezController);    // GET /api/juez/:id
router.put("/:id", actualizarJuezController); // PUT /api/juez/:id
router.delete("/:id", eliminarJuezController);// DELETE /api/juez/:id

export default router;
