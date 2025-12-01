// src/components/users/CompetitionModal.tsx
import React, { useEffect, useState } from "react";
import styles from "../../styles/modalCompetenciasInfo.module.css";

interface Competition {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto: string;
  fecha_evento: string;
  categoria: string;
  costo: string;
  ubicacion?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  competencia: Competition | null;
}

const GENERIC_MAP = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3766.8694359667397!2d-98.9466476247904!3d19.24452118199507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTnCsDE0JzQwLjMiTiA5OMKwNTYnMzguNyJX!5e0!3m2!1ses!2smx!4v1761276700501!5m2!1ses!2smx";

/** Extrae coords desde lat/lng o desde la cadena ubicacion */
function parseCoords(comp: Competition | null): { lat: number | null; lng: number | null } {
  if (!comp) return { lat: null, lng: null };

  // 1) si vienen lat/lng explícitos (pueden ser string o number)
  if (comp.lat !== undefined && comp.lat !== null && comp.lng !== undefined && comp.lng !== null) {
    const la = Number(String(comp.lat));
    const lo = Number(String(comp.lng));
    if (Number.isFinite(la) && Number.isFinite(lo)) return { lat: la, lng: lo };
  }

  // 2) intentar parsear desde la cadena ubicacion (buscar floats)
  if (comp.ubicacion) {
    const matches = Array.from(String(comp.ubicacion).matchAll(/-?\d+\.\d+/g)).map(m => m[0]);
    if (matches.length >= 2) {
      const la = Number(matches[0]);
      const lo = Number(matches[1]);
      if (Number.isFinite(la) && Number.isFinite(lo)) return { lat: la, lng: lo };
    }
  }

  return { lat: null, lng: null };
}

/** Construye la URL del iframe: primero lat/lng si existen, si no usa la cadena ubicacion como búsqueda */
function buildIframeSrc(comp: Competition | null): string {
  if (!comp) return GENERIC_MAP;
  const { lat, lng } = parseCoords(comp);
  if (lat !== null && lng !== null) {
    // usar q=lat,lng para centrar en las coordenadas
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=14&output=embed`;
  }
  if (comp.ubicacion) {
    return `https://www.google.com/maps?q=${encodeURIComponent(comp.ubicacion)}&z=14&output=embed`;
  }
  return GENERIC_MAP;
}

const CompetitionModal: React.FC<ModalProps> = ({ isOpen, onClose, competencia }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [iframeSrc, setIframeSrc] = useState<string>(GENERIC_MAP);

  // Actualizar src cada vez que cambie la competencia
  useEffect(() => {
    setMapLoading(true);
    setIframeSrc(buildIframeSrc(competencia));
  }, [competencia]);

  // Resetear loader cuando se abre/cierra
  useEffect(() => {
    if (!isOpen) {
      // pequeño delay para permitir animación de cierre si la tuvieses
      setTimeout(() => {
        setMapLoading(true);
      }, 200);
    }
  }, [isOpen]);

  if (!isOpen || !competencia) return null;

  const fechaEvento = new Date(competencia.fecha_evento).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleClose = () => {
    setIsClosing(true);
    // permitir animación
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setMapLoading(true); // resetear para la próxima apertura
    }, 250);
  };

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.exit : ""}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="competition-modal-title"
    >
      <div className={styles.modal}>

        <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">✕</button>

        <h2 id="competition-modal-title" className={styles.title}>{competencia.nombre}</h2>

        <div className={styles.info}>
          <p><strong>Tipo:</strong> {competencia.tipo}</p>
          <p><strong>Categoría:</strong> {competencia.categoria}</p>
          <p><strong>Fecha del evento:</strong> {fechaEvento}</p>
          <p><strong>Costo:</strong> ${competencia.costo} MXN</p>
        </div>

        <div className={styles.mapaContainer} aria-live="polite">
          {mapLoading && (
            <div className={styles.mapLoader}>
              <div className={styles.spinner} aria-hidden></div>
              <span>Cargando mapa...</span>
            </div>
          )}

          <iframe
            src={iframeSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de la competencia"
            onLoad={() => setMapLoading(false)}
            style={{ width: "100%", height: 320, border: 0, borderRadius: 8 }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompetitionModal;
