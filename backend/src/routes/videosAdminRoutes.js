// src/routes/videosAdminRoute.js
import express from "express";
import multer from "multer";
import path from "path";
import {
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "../controllers/videosAdminController.js";

const router = express.Router();

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Rutas CRUD
router.get("/", getVideos);
router.post("/", upload.single("videoLocal"), createVideo);
router.put("/:id", upload.single("videoLocal"), updateVideo);
router.delete("/:id", deleteVideo);

export default router;
