import React from "react";
import Footer from "../components/Footer";
import "../styles/disponibles.css"

const SinCompetencias: React.FC = () => {
  return (
    <>
      <div className="page">
        <div className="container">
          {/* Panel izquierdo con imagen de powerlifting */}
          <div className="imagePanel">
            <img
              src="belta.jpg" // Imagen de powerlifting
              alt="Powerlifting"
              className="image"
            />
          </div>

          {/* Panel derecho con contenido */}
          <div className="contentPanel">
            <h1 className="mainTitle">Inscríbete y deja tu marca en la plataforma.</h1>

            <div className="card">
              <h2 className="title">Sin Competencias Disponibles</h2>
              <div className="underline"></div>

              {/* Logo de la asociación deportiva */}
              <img
                src="power.jpg" // Logo de la asociación
                alt="Asociación Deportiva de Lifters"
                className="associationLogo"
              />

              <p className="paragraph">
                Para estar informado a última hora de las futuras competencias verifica 
                la sección de <strong>“Difusión de Información”</strong> o síguenos en:
              </p>

              <div className="socialIcons">
                <a href="#" title="Facebook">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
                    alt="Facebook"
                    className="icon"
                  />
                </a>
                <a href="#" title="Instagram">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                    alt="Instagram"
                    className="icon"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SinCompetencias;
