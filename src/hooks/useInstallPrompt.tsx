// src/hooks/useInstallPrompt.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const INSTALL_FLAG_KEY = "jueces_install_shown_v1";

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    function handler(e: any) {
      const currentPath = window.location.pathname || location.pathname;
      // Ignorar si no estamos dentro de /jueces
      if (!currentPath.startsWith("/jueces")) {
        return;
      }
      // Ignorar si ya mostramos la pantalla de instalación antes
      if (localStorage.getItem(INSTALL_FLAG_KEY)) {
        console.log("Install prompt previamente mostrado, ignorando beforeinstallprompt.");
        return;
      }

      e.preventDefault();
      setDeferredPrompt(e);
      console.log("beforeinstallprompt capturado (listo para mostrar)");
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [location.pathname]);

  // showPrompt lo llamas solo cuando quieres: tras login la primera vez o con un botón
  const showPrompt = async () => {
    // Si ya mostramos antes, bloqueamos
    if (localStorage.getItem(INSTALL_FLAG_KEY)) {
      return { outcome: "already-shown" };
    }
    // Debe haber un deferredPrompt y estar en /jueces
    if (!deferredPrompt || !window.location.pathname.startsWith("/jueces")) {
      return { outcome: "no-deferred-or-wrong-route" };
    }

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      // marcar que ya mostramos el prompt (aceptado o no, no insistimos más)
      localStorage.setItem(INSTALL_FLAG_KEY, "1");
      setDeferredPrompt(null);
      return choice;
    } catch (err) {
      console.error("Error mostrando prompt de instalación:", err);
      return { outcome: "error" };
    }
  };

  // helper para tests / para resetear (opcional)
  const resetPromptFlag = () => {
    localStorage.removeItem(INSTALL_FLAG_KEY);
  };

  return { deferredPrompt, showPrompt, resetPromptFlag };
}
