// backend/src/routes/categoriasAdminRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url"; 

import { getCategorias, saveCategorias } from "../controllers/categoriasAdminController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Multer para categorías
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Asegúrate de que esta ruta sea correcta desde la raíz de tu proyecto
    // Usamos path.join(__dirname, '../uploads') para ir un nivel arriba y luego a 'uploads'
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // Generar un nombre de archivo único para las imágenes de categorías
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `categoria_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// `upload` para categorías. Usamos `.any()` para manejar múltiples archivos con nombres dinámicos.
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
  }
});

// Rutas
router.get("/", getCategorias);
router.post("/", upload.any(), saveCategorias);

export default router;