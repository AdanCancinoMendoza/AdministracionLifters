import React from "react";
import { FaUser, FaUsers, FaCalendarAlt, FaTrophy } from "react-icons/fa";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import styles from "../../styles/InformacionScreen.module.css";

const InformacionScreen: React.FC = () => {
  const usuario = "Adán";
  const juecesActivos = ["María", "Carlos", "Lucía", "Luis", "Elena"];
  const competencia = "Campeonato Nacional de Powerlifting";
  const fechaInicio = "15 Octubre 2025";

  return (
    <div className={styles.informacionScreen}>
      <div className={styles.informacionContainer}>
        <h1 className={styles.informacionTitulo}>Información del Evento</h1>

        {/* Imagen */}
        <div className={styles.infoImagenContainer}>
          <img
            src="https://a.travel-assets.com/findyours-php/viewfinder/images/res70/228000/228103-Puebla-Province.jpg"
            alt="Imagen del evento"
            className={styles.infoImagen}
          />
        </div>

        {/* Usuario */}
        <div className={`${styles.infoCard} ${styles.cardUsuario}`}>
          <div className={styles.cardIcon}>
            <FaUser />
          </div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Usuario</p>
            <p className={styles.cardText}>{usuario}</p>
          </div>
        </div>

        {/* Jueces activos */}
        <div className={`${styles.infoCard} ${styles.cardJueces}`}>
          <div className={styles.cardHeader}>
            <FaUsers className={styles.cardHeaderIcon} />
            <p className={styles.cardHeaderTitle}>Jueces Activos</p>
          </div>
          <ul className={styles.juecesLista}>
            {juecesActivos.map((juez, i) => (
              <li key={i} className={styles.juezItem}>
                ✮ {juez}
              </li>
            ))}
          </ul>
        </div>

        {/* Competencia */}
        <div className={`${styles.infoCard} ${styles.cardCompetencia}`}>
          <div className={styles.cardHeader}>
            <FaTrophy className={styles.cardHeaderIcon} />
            <p className={styles.cardHeaderTitle}>{competencia}</p>
          </div>
          <div className={styles.cardFecha}>
            <FaCalendarAlt />
            <span>Fecha de inicio: {fechaInicio}</span>
          </div>
        </div>
      </div>

      <BottomNavigationMenuCentral selected="informacion" />
    </div>
  );
};

export default InformacionScreen;
