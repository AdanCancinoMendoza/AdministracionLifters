// backend/src/server.js
import express from "express";
import cors from "cors";
import http from "http";
import { Server as IOServer } from "socket.io";

import inicioRouter from "./routes/inicioAdminRoutes.js";
import categoriasRouter from "./routes/categoriasAdminRoutes.js";
import posterRouter from "./routes/posterAdminRoutes.js";
import videosAdminRoute from "./routes/videosAdminRoutes.js";
import competenciasAdminRoutes from "./routes/competenciasAdminRoutes.js";
import publicacionAdminRoutes from "./routes/publicacionAdminRoutes.js";
import competidorRoutes from "./routes/competidorRoutes.js";
import juezRoutes from "./routes/juezAdminRoutes.js";
import liveStreamRoutes from "./routes/liveStreamRoutes.js";
import modulesRoutes from "./routes/modulesRoutes.js";
import attemptsRoutes from "./routes/attemptsRoutes.js";

import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carpeta de uploads accesible públicamente
app.use("/uploads", express.static(path.resolve("src/uploads")));

// Rutas principales
app.use("/api/inicio", inicioRouter);
app.use("/api/categorias", categoriasRouter);
app.use("/api/poster", posterRouter);
app.use("/api/videos", videosAdminRoute);
app.use("/api/competenciasadmin", competenciasAdminRoutes);
app.use("/api/publicacion", publicacionAdminRoutes);
app.use("/api/competidor", competidorRoutes);
app.use("/api/juez", juezRoutes);
app.use("/api/lives", liveStreamRoutes);
app.use("/api/modules", modulesRoutes);
app.use("/api/attempts", attemptsRoutes);

/*
  SOCKET.IO SETUP
  - Se crea un servidor HTTP y Socket.IO.
  - Exponemos `io` en app.set('io', io) para que los controladores puedan emitir eventos:
      const io = req.app.get('io');
      io.to(`competencia:${id_competencia}`).emit('vote_update', payload);
*/
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: "*", // ajustar en producción a la URL de tu frontend
    methods: ["GET", "POST", "PATCH"],
  },
});

// Exponer io para que los controladores puedan usar req.app.get('io')
app.set("io", io);

// Manejo de conexiones socket
io.on("connection", (socket) => {
  console.log("Socket conectado:", socket.id);

  socket.on("join", (payload) => {
    // payload: { id_competencia }
    const id_competencia = payload?.id_competencia;
    if (id_competencia) {
      const room = `competencia:${id_competencia}`;
      socket.join(room);
      console.log(`Socket ${socket.id} se unió a ${room}`);
    }
  });

  socket.on("leave", (payload) => {
    const id_competencia = payload?.id_competencia;
    if (id_competencia) {
      const room = `competencia:${id_competencia}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} salió de ${room}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket desconectado:", socket.id, "motivo:", reason);
  });
});

// Helper: obtener IPs IPv4 no internas
function getLocalIPv4Addresses() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // IPv4 only and not internal (exclude 127.0.0.1 and internal adapters)
      if (net.family === "IPv4" && !net.internal) {
        results.push({ iface: name, address: net.address });
      }
    }
  }
  return results;
}

// Escuchar en 0.0.0.0 para exponer el servidor en la LAN
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
  console.log(` - Local:   http://localhost:${PORT}`);

  const addrs = getLocalIPv4Addresses();
  if (addrs.length === 0) {
    console.log(" - Network: no se detectaron IPs de red (revisa tu conexión).");
  } else {
    for (const a of addrs) {
      console.log(` - Network (${a.iface}): http://${a.address}:${PORT}`);
    }
  }

  console.log("Nota: asegúrate de permitir el puerto en el firewall si tu móvil no puede acceder.");
});
