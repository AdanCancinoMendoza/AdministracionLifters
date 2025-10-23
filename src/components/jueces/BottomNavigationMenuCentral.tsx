import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaDumbbell, FaUser, FaStar, FaChartBar } from "react-icons/fa";
import styles from "../../styles/BottomNavJuez.module.css";

interface Props {
  selected: string;
}

const BottomNavigationMenuCentral: React.FC<Props> = ({ selected }) => {
  const navigate = useNavigate();

  const items = [
    { id: "inicio", label: "Inicio", icon: <FaHome />, path: "/jueces/inicio" },
    { id: "buscador", label: "Buscador", icon: <FaDumbbell />, path: "/jueces/buscador" },
    { id: "calificar", label: "Calificar", icon: <FaStar />, path: "/jueces/calificar" },
    { id: "resultados", label: "Resultados", icon: <FaChartBar />, path: "/jueces/resultados" },
    { id: "perfil", label: "Perfil", icon: <FaUser />, path: "/jueces/perfil" },
  ];

  return (
    <nav className={styles.container} aria-label="Menú inferior jueces">
      <div className={styles.nav}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            data-id={item.id}
            aria-label={item.label}
            className={`${styles.item} ${selected === item.id ? styles.active : ""} ${
              item.id === "calificar" ? styles.fab : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigationMenuCentral;
