import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  crearCompetenciaController,
  obtenerCompetenciasController,
  obtenerCompetenciaController,
  actualizarCompetenciaController,
  eliminarCompetenciaController
} from "../controllers/competenciasAdminController.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Crear
router.post("/", upload.single("foto"), crearCompetenciaController);

// Obtener todas
router.get("/", obtenerCompetenciasController);

// Obtener por ID
router.get("/:id", obtenerCompetenciaController);

// Actualizar
router.put("/:id", upload.single("foto"), actualizarCompetenciaController);

// Eliminar
router.delete("/:id", eliminarCompetenciaController);

export default router;
