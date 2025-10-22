import React from "react";
import {
  FaUser,
  FaUsers,
  FaCalendarAlt,
  FaTrophy,
} from "react-icons/fa";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import "../../styles/perfilJuez.css";

const InformacionScreen: React.FC = () => {
  const usuario = "Adán";
  const juecesActivos = ["María", "Carlos", "Lucía", "Luis", "Elena"];
  const competencia = "Campeonato Nacional de Powerlifting";
  const fechaInicio = "15 Octubre 2025";

  return (
    <div className="informacion-screen">
      <div className="informacion-container">
        <h1 className="informacion-titulo">Información del Evento</h1>
                {/* Imagen */}
        <div className="info-imagen-container">
          <img
            src="https://a.travel-assets.com/findyours-php/viewfinder/images/res70/228000/228103-Puebla-Province.jpg"
            alt="Imagen del evento"
            className="info-imagen"
          />
        </div>

        {/* Usuario */}
        <div className="info-card card-usuario">
          <div className="card-icon">
            <FaUser />
          </div>
          <div className="card-content">
            <p className="card-label">Usuario</p>
            <p className="card-text">{usuario}</p>
          </div>
        </div>

        {/* Jueces activos */}
        <div className="info-card card-jueces">
          <div className="card-header">
            <FaUsers className="card-header-icon" />
            <p className="card-header-title">Jueces Activos</p>
          </div>
          <ul className="jueces-lista">
            {juecesActivos.map((juez, i) => (
              <li key={i} className="juez-item">
                ✮ {juez}
              </li>
            ))}
          </ul>
        </div>

        {/* Competencia */}
        <div className="info-card card-competencia">
          <div className="card-header">
            <FaTrophy className="card-header-icon" />
            <p className="card-header-title">{competencia}</p>
          </div>
          <div className="card-fecha">
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
