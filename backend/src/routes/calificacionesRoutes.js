import express from "express";
import {
  registrarCalificacionController,
  obtenerTallyController
} from "../controllers/calificacionesController.js";

const router = express.Router();

router.post("/:id/calificaciones", registrarCalificacionController);
router.get(
  "/:id/calificaciones/:id_competidor/:id_ejercicio/:intento",
  obtenerTallyController
);

export default router;
