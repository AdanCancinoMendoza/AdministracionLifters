import { useState } from "react";
import styles from "../../styles/modalCompetenciasInfo.module.css";

interface Competition {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto: string;
  fecha_evento: string;
  categoria: string;
  costo: string;
  ubicacion: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  competencia: Competition | null;
}

const CompetitionModal = ({ isOpen, onClose, competencia }: ModalProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  if (!isOpen || !competencia) return null;

  const fechaEvento = new Date(competencia.fecha_evento).toLocaleDateString(
    "es-MX",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setMapLoading(true); // reset carga del mapa
    }, 250);
  };

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.exit : ""}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={styles.modal}>
        {/* Botón cerrar */}
        <button className={styles.closeBtn} onClick={handleClose}>✕</button>

        {/* Información del evento */}
        <h2 className={styles.title}>{competencia.nombre}</h2>
        <div className={styles.info}>
          <p><strong>Tipo:</strong> {competencia.tipo}</p>
          <p><strong>Categoría:</strong> {competencia.categoria}</p>
          <p><strong>Fecha del evento:</strong> {fechaEvento}</p>
          <p><strong>Costo:</strong> ${competencia.costo} MXN</p>
        </div>

        {/* Mapa con loader */}
        <div className={styles.mapaContainer}>
          {mapLoading && (
            <div className={styles.mapLoader}>
              <div className={styles.spinner}></div>
              <span>Cargando mapa...</span>
            </div>
          )}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3766.8694359667397!2d-98.9466476247904!3d19.24452118199507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTnCsDE0JzQwLjMiTiA5OMKwNTYnMzguNyJX!5e0!3m2!1ses!2smx!4v1761276700501!5m2!1ses!2smx"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de la competencia"
            onLoad={() => setMapLoading(false)}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default CompetitionModal;
