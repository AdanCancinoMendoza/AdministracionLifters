import express from "express";
import cors from "cors";
import inicioRouter from "./routes/inicioAdminRoutes.js";
import path from "path";

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // para que Vite pueda hacer fetch
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('src/uploads'))); // para servir imágenes

// Montar rutas
app.use("/api/inicio", inicioRouter);

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
