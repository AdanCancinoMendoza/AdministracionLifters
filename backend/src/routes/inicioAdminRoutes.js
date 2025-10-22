import express from "express";
import multer from "multer";
import path from "path";
import { getInicio, updateInicio } from "../controllers/inicioAdminController.js";

const router = express.Router();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "src/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Rutas
router.get("/", getInicio);
router.put("/", upload.single("imagen"), updateInicio);

export default router;
