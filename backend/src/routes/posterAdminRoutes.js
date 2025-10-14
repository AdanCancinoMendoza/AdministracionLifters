import express from "express";
import multer from "multer";
import path from "path";
// Importar las funciones correctas del controlador
import { getPoster, updatePoster } from "../controllers/posterAdminController.js";

const router = express.Router();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Asegúrate de que este path sea correcto desde la raíz de tu proyecto
    cb(null, "src/uploads/");
  },
  filename: (req, file, cb) => {
    // Generar un nombre de archivo único
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Rutas
router.get("/", getPoster);
router.put("/", upload.single("imagen"), updatePoster);

export default router;