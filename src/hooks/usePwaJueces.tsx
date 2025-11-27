// src/hooks/usePwaJueces.tsx  (modifica el existente)
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function usePwaJueces(isAuthenticatedJuez: boolean) {
  const location = useLocation();

  useEffect(() => {
    const isJueces = location.pathname.startsWith("/jueces");
    const id = "pwa-manifest-jueces";
    let link = document.getElementById(id) as HTMLLinkElement | null;

    if (isJueces) {
      if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "manifest";
        link.href = "/manifest-jueces.json";
        // Insertar pronto en head
        const head = document.head || document.getElementsByTagName("head")[0];
        head.appendChild(link);
        console.log("manifest-jueces inyectado");
      } else {
        // por si ya existe, asegurar href
        link.href = "/manifest-jueces.json";
        console.log("manifest-jueces ya presente");
      }
    } else {
      if (link) {
        link.remove();
        console.log("manifest-jueces removido");
      }
    }

    // Registrar service worker solo si estamos en /jueces y el juez está autenticado
    async function registerSw() {
      if ("serviceWorker" in navigator && isJueces && isAuthenticatedJuez) {
        try {
          const reg = await navigator.serviceWorker.register("/service-worker.js", {
            scope: "/jueces/",
          });
          console.log("Service Worker registrado (scope /jueces/):", reg.scope);
        } catch (err) {
          console.error("Error registrando Service Worker:", err);
        }
      }
    }
    registerSw();

  }, [location.pathname, isAuthenticatedJuez]);
}
