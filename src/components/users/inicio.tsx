import React, { useState } from "react";
import Footer from "../components/Footer";
import "../styles/inicio.css";

const logrosData = [
  {
    title: "Press de Banca",
    competitors: [
      { name: "Prisciliano Juárez Luna Zamora", weight: "250 kg" },
      { name: "Mauriliano Luna Rodríguez", weight: "160 kg" },
      { name: "Maximiliano Pérez Flores", weight: "140 kg" },
    ],
  },
  {
    title: "Peso Muerto",
    competitors: [
      { name: "Brayan Emanuel Flores Rivera", weight: "285 kg" },
      { name: "Otro Competidor", weight: "220 kg" },
      { name: "Maximiliano Pérez Flores", weight: "140 kg" },
    ],
  },
  {
    title: "Sentadilla",
    competitors: [
      { name: "Competidor A", weight: "200 kg" },
      { name: "Competidor B", weight: "180 kg" },
      { name: "Maximiliano Pérez Flores", weight: "140 kg" },
    ],
  },
];

const medallas = ["Medalla_oro.png", "medalla_plata.png", "Medalla_bronce.png"];

const Dashboard: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % logrosData.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + logrosData.length) % logrosData.length);

  return (
    <>
      

      <main className="dashboard-main">
        {/* HERO */}
        <section
          className="hero-section"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/fondo-pesas.jpg)`,
          }}
        >
          <h1>
            Bienvenido al Sistema de Competencias de la <br />
            Asociación Deportiva de Lifters del Estado de Puebla
          </h1>
        </section>

        {/* LOGROS */}
        <h2 className="section-title">Logros</h2>
        <div className="carousel-container">
          <button onClick={prevSlide} className="carousel-btn left">◀</button>
          <button onClick={nextSlide} className="carousel-btn right">▶</button>

          <div className="carousel-slide">
            <div className="competitors">
              <h3>{logrosData[activeIndex].title}</h3>
              {logrosData[activeIndex].competitors.map((c, i) => (
                <div key={i} className="competitor">
                  <img
                    src={medallas[i] || "medalla.png"}
                    alt={`Medalla ${i + 1}`}
                    className="medalla-icon"
                  />
                  <span>{`${c.name} - ${c.weight}`}</span>
                </div>
              ))}
            </div>
            <div className="competencia-img">
              <img src={`${process.env.PUBLIC_URL}/barbell.jpg`} alt="Powerlifting" />
            </div>
          </div>
        </div>

        {/* ¿Qué es el Powerlifting? */}
        <section className="section powerlifting-info">
          <h2>
            <button className="link-button">¿Qué es el Powerlifting?</button>
          </h2>
          <div className="descripcion">
            <p>
              El powerlifting es un deporte de fuerza que se basa en levantar el
              mayor peso posible en tres movimientos:
            </p>
          </div>

          <div className="movimientos">
            <div className="mov">
              <img src={`${process.env.PUBLIC_URL}/gimnasia.png`} alt="Sentadilla" />
              <p>Sentadilla</p>
            </div>
            <div className="mov">
              <img src={`${process.env.PUBLIC_URL}/levantamiento-de-pesos.png`} alt="Peso Muerto" />
              <p>Peso Muerto</p>
            </div>
            <div className="mov">
              <img src={`${process.env.PUBLIC_URL}/gimnasio.png`} alt="Press de Banca" />
              <p>Press de Banca</p>
            </div>
          </div>

          <div className="descripcion">
            <p>
              Cada atleta tiene tres intentos por levantamiento y su mejor
              intento en cada uno se suma para obtener un total. Es un deporte
              que requiere técnica, constancia y mucha disciplina.
            </p>
          </div>
        </section>

        {/* Próxima competencia */}
        <h2 className="section-title">Próxima Competencia</h2>
        <div className="card competencia">
          <div className="texto">
            <p>📅 <strong>Fecha:</strong> 15 de agosto de 2025</p>
            <p>📍 <strong>Lugar:</strong> Centro Deportivo Universitario, Tecamachalco</p>
            <p>🔔 <strong>Detalles:</strong> Clasificatoria nacional con presencia de jueces oficiales. ¡Prepárate!</p>
          </div>
          <img src={`${process.env.PUBLIC_URL}/Explanada-Puebla.jpg`} alt="Póster de competencia" />
        </div>

        {/* Poster */}
        <h2 className="section-title">Próxima competencia</h2>
        <div className="poster-container">
          <img src={`${process.env.PUBLIC_URL}/poster1.jpg`} alt="Póster de competencia" />
        </div>

        {/* Videos */}
        <h2 className="section-title">Videos de Competencias</h2>
        <div className="card competencia videos">
          <p>Revive momentos de nuestras competencias pasadas:</p>
          <div className="videos-grid">
            <iframe
              width="320"
              height="180"
              src="https://www.youtube.com/embed/jETE_zRD_XM"
              title="Competencia 1"
              allowFullScreen
            />
            <iframe
              width="320"
              height="180"
              src="https://www.youtube.com/embed/9eM-PN20WHk"
              title="Competencia 2"
              allowFullScreen
            />
            <iframe
              width="320"
              height="180"
              src="https://www.youtube.com/embed/3VRIRNKkj_I"
              title="Competencia 3"
              allowFullScreen
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Dashboard;
