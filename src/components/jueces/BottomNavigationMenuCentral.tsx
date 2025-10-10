import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaDumbbell, FaUser, FaStar, FaChartBar } from "react-icons/fa";
import "../../styles/bottomNavJuez.css";

interface Props {
  selected: string;
}

const BottomNavigationMenuCentral: React.FC<Props> = ({ selected }) => {
  const navigate = useNavigate();

  const items = [
    { id: "inicio", label: "Inicio", icon: <FaHome />, path: "/jueces/inicio" },
    {id: "buscador", label: "Buscador", icon: <FaDumbbell />, path: "/jueces/buscador"},
    { id: "calificar", label: "Calificar", icon: <FaStar />, path: "/jueces/calificar" },
    { id: "resultados", label: "Resultados", icon: <FaChartBar />, path: "/jueces/resultados" },
    { id: "perfil", label: "Perfil", icon: <FaUser />, path: "/jueces/perfil" },
  ];

  return (
    <nav className="bnj-container" aria-label="Menú inferior jueces">
      <div className="bnj-nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            data-id={item.id}
            aria-label={item.label}
            className={`bnj-item ${selected === item.id ? "bnj-active" : ""} ${item.id === "calificar" ? "bnj-fab" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="bnj-icon">{item.icon}</span>
            <span className="bnj-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigationMenuCentral;
