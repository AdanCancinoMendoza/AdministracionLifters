import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  crearPublicacionController,
  obtenerPublicacionesController,
  obtenerPublicacionPorIdController,
  actualizarPublicacionController,
  eliminarPublicacionController,
} from "../controllers/publicacionAdminController.js";

const router = express.Router();

// Configuración de rutas y carpeta de uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, "../uploads");

//  Crear carpeta si no existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

//  Configuración de Multer para archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

/* ================================
   RUTAS DE PUBLICACIONES ADMIN
================================ */

//  Crear publicación (imagen/video opcional)
router.post("/", upload.single("Contenido"), crearPublicacionController);

//  Obtener todas las publicaciones
router.get("/", obtenerPublicacionesController);

//  Obtener una publicación por ID
router.get("/:id", obtenerPublicacionPorIdController);

//  Actualizar una publicación
router.put("/:id", upload.single("Contenido"), actualizarPublicacionController);

//  Eliminar una publicación
router.delete("/:id", eliminarPublicacionController);

export default router;
