// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // redirige /api/... a tu backend local (puerto 3001)
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      // opcional: si usas websockets en /socket.io, agrega esto:
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        changeOrigin: true,
      }
    }
  }
});
