// backend/src/server.js
import express from "express";
import cors from "cors";
import inicioRouter from "./routes/inicioAdminRoutes.js";
import categoriasRouter from "./routes/categoriasAdminRoutes.js";
import posterRouter from "./routes/posterAdminRoutes.js";
import videosAdminRoute from "./routes/videosAdminRoutes.js";
import competenciasAdminRoutes from "./routes/competenciasAdminRoutes.js";
import publicacionAdminRoutes from "./routes/publicacionAdminRoutes.js"

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Carpeta de uploads accesible públicamente
app.use("/uploads", express.static(path.resolve("src/uploads")));

// ✅ Rutas principales
app.use("/api/inicio", inicioRouter);
app.use("/api/categorias", categoriasRouter);
app.use("/api/poster", posterRouter);
app.use("/api/videos", videosAdminRoute);
app.use("/api/competenciasadmin", competenciasAdminRoutes);
app.use("/api/publicacion",publicacionAdminRoutes)



// ✅ Servidor activo
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
