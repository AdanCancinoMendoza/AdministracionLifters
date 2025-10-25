import { useState } from "react";
import styles from "../../styles/UsersNAcompetencia.module.css";
import logo from "../../assets/LOgo.png";
import motivacionn from "../../assets/Motivacion.png";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SinCompetenciasModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  };

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.exit : ""}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={handleClose}>
          ✕
        </button>

        <div className={styles.content}>
          <div className={styles.imagePanel}>
            <img src={motivacionn} alt="Powerlifting" />
          </div>

          <div className={styles.infoPanel}>
            <h1 className={styles.mainTitle}>
              Inscríbete y deja tu marca en la plataforma.
            </h1>

            <div className={styles.card}>
              <h2 className={styles.title}>Sin Competencias Disponibles</h2>
              <div className={styles.underline}></div>

              <img
                src={logo}
                alt="Asociación Deportiva de Lifters"
                className={styles.associationLogo}
              />

              <p className={styles.paragraph}>
                Para estar informado a última hora de las futuras competencias verifica 
                la sección de <strong>“Difusión de Información”</strong> o síguenos en:
              </p>

              <div className={styles.socialIcons}>
                <a href="#" title="Facebook">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
                    alt="Facebook"
                    className={styles.icon}
                  />
                </a>
                <a href="#" title="Instagram">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                    alt="Instagram"
                    className={styles.icon}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinCompetenciasModal;
