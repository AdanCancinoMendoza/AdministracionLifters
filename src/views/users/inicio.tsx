import React, { useState } from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/UsersInicio.module.css";

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

const medallas = [
  "https://upload.wikimedia.org/wikipedia/commons/4/44/Gold_medal_icon.svg",
  "https://upload.wikimedia.org/wikipedia/commons/9/99/Silver_medal_icon.svg",
  "https://upload.wikimedia.org/wikipedia/commons/8/87/Bronze_medal_icon.svg",
];

const InicioUsuarios: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % logrosData.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + logrosData.length) % logrosData.length);

  return (
    <>
      <main className={styles.dashboardMain}>
        {/* HERO */}
        <section
          className={styles.heroSection}
          style={{ backgroundImage: `url("https://images.unsplash.com/photo-1599058917217-963e37f41c05?auto=format&fit=crop&w=1470&q=80")` }}
        >
          <h1>
            Bienvenido al Sistema de Competencias de la <br />
            Asociación Deportiva de Lifters del Estado de Puebla
          </h1>
        </section>

        {/* LOGROS */}
        <h2 className={styles.sectionTitle}>Logros</h2>
        <div className={styles.carouselContainer}>
          <button onClick={prevSlide} className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}>◀</button>
          <button onClick={nextSlide} className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}>▶</button>

          <div className={styles.carouselSlide}>
            <div className={styles.competitors}>
              <h3>{logrosData[activeIndex].title}</h3>
              {logrosData[activeIndex].competitors.map((c, i) => (
                <div key={i} className={styles.competitor}>
                  <img
                    src={medallas[i] || medallas[0]}
                    alt={`Medalla ${i + 1}`}
                    className={styles.medallaIcon}
                  />
                  <span>{`${c.name} - ${c.weight}`}</span>
                </div>
              ))}
            </div>
            <div className={styles.competenciaImg}>
              <img
                src="https://images.unsplash.com/photo-1599058917004-2cfa5d0c2c0b?auto=format&fit=crop&w=870&q=80"
                alt="Powerlifting"
              />
            </div>
          </div>
        </div>

        {/* Powerlifting Info */}
        <section className={styles.powerliftingInfo}>
          <h2><button className={styles.linkButton}>¿Qué es el Powerlifting?</button></h2>
          <div className={styles.descripcion}>
            <p>El powerlifting es un deporte de fuerza que se basa en levantar el mayor peso posible en tres movimientos:</p>
          </div>
          <div className={styles.movimientos}>
            <div className={styles.mov}>
              <img src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=800&q=80" alt="Sentadilla" />
              <p>Sentadilla</p>
            </div>
            <div className={styles.mov}>
              <img src="https://images.unsplash.com/photo-1599058917115-c504b2a6259f?auto=format&fit=crop&w=800&q=80" alt="Peso Muerto" />
              <p>Peso Muerto</p>
            </div>
            <div className={styles.mov}>
              <img src="https://images.unsplash.com/photo-1605296867296-3923f83f1f1f?auto=format&fit=crop&w=800&q=80" alt="Press de Banca" />
              <p>Press de Banca</p>
            </div>
          </div>
          <div className={styles.descripcion}>
            <p>Cada atleta tiene tres intentos por levantamiento y su mejor intento en cada uno se suma para obtener un total. Es un deporte que requiere técnica, constancia y mucha disciplina.</p>
          </div>
        </section>

        {/* Próxima competencia */}
        <h2 className={styles.sectionTitle}>Próxima Competencia</h2>
        <div className={`${styles.card} ${styles.cardCompetencia}`}>
          <div className={styles.texto}>
            <p>📅 <strong>Fecha:</strong> 15 de agosto de 2025</p>
            <p>📍 <strong>Lugar:</strong> Centro Deportivo Universitario, Tecamachalco</p>
            <p>🔔 <strong>Detalles:</strong> Clasificatoria nacional con presencia de jueces oficiales. ¡Prepárate!</p>
          </div>
          <img src="https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=800&q=80" alt="Póster de competencia" />
        </div>

        {/* Poster */}
        <div className={styles.posterContainer}>
          <img src="https://images.unsplash.com/photo-1562774050-9c120d0ab274?auto=format&fit=crop&w=800&q=80" alt="Póster de competencia" />
        </div>

        {/* Videos */}
        <h2 className={styles.sectionTitle}>Videos de Competencias</h2>
        <div className={`${styles.card} ${styles.cardVideos}`}>
          <p>Revive momentos de nuestras competencias pasadas:</p>
          <div className={styles.videosGrid}>
            <iframe width="320" height="180" src="https://www.youtube.com/embed/jETE_zRD_XM" title="Competencia 1" allowFullScreen />
            <iframe width="320" height="180" src="https://www.youtube.com/embed/9eM-PN20WHk" title="Competencia 2" allowFullScreen />
            <iframe width="320" height="180" src="https://www.youtube.com/embed/3VRIRNKkj_I" title="Competencia 3" allowFullScreen />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default InicioUsuarios;
