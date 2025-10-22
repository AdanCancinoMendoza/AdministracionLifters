import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  crearCompetidorController,
  obtenerCompetidoresController,
  obtenerCompetidorPorIdController,
  actualizarCompetidorController,
  eliminarCompetidorController,
} from "../controllers/competidorController.js";

const router = express.Router();

// Carpeta uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Multer configuración
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Rutas
router.post("/", upload.single("comprobante_pago"), crearCompetidorController);
router.get("/", obtenerCompetidoresController);
router.get("/:id", obtenerCompetidorPorIdController);
router.put("/:id", upload.single("comprobante_pago"), actualizarCompetidorController);
router.delete("/:id", eliminarCompetidorController);

export default router;
