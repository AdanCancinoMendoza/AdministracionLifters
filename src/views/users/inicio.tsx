import React, { useEffect, useState, useRef } from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/UsersInicio.module.css";
import sentadilla from "../../assets/sentadilla.png";
import press from "../../assets/press.png";
import pesomuerto from "../../assets/kill.png";

// MEDALLAS
import oro from "../../assets/oro.png";
import plata from "../../assets/plata.png";
import bronce from "../../assets/bronce.png";

interface Ganador {
  id: number;
  nombre: string;
  peso: string;
  medalla: "oro" | "plata" | "bronce";
}

interface Categoria {
  id: number;
  nombre: string;
  imagen: string;
  fecha_actualizacion: string;
  ganadores: Ganador[];
}

interface Competencia {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto: string;
  fecha_inicio: string;
  fecha_cierre: string;
  fecha_evento: string;
  categoria: string;
  costo: string;
  ubicacion: string;
}

interface Poster {
  id: number;
  imagen_url: string;
}

interface Video {
  id: number;
  linkVideo: string | null;
  videoLocal: string | null;
}

interface Inicio {
  ID: number;
  Descripcion: string;
  Imagen: string;
  actualizado: string;
}

const medallasMap: Record<string, string> = {
  plata: plata,
  oro: oro,
  bronce: bronce,
};

const InicioUsuarios: React.FC = () => {
  const [inicio, setInicio] = useState<Inicio | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [poster, setPoster] = useState<Poster | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Referencias para las secciones
  const heroRef = useRef<HTMLElement>(null);
  const powerliftingRef = useRef<HTMLElement>(null);
  const logrosRef = useRef<HTMLElement>(null);
  const competenciaRef = useRef<HTMLElement>(null);
  const posterRef = useRef<HTMLElement>(null);
  const videosRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Cargar datos
    fetch("http://localhost:3001/api/inicio")
      .then(res => res.json())
      .then(setInicio)
      .catch(err => console.error(err));

    fetch("http://localhost:3001/api/categorias")
      .then(res => res.json())
      .then(setCategorias)
      .catch(err => console.error(err));

    fetch("http://localhost:3001/api/competenciasadmin")
      .then(res => res.json())
      .then((data: Competencia[]) => setCompetencia(data[0] || null))
      .catch(err => console.error(err));

    fetch("http://localhost:3001/api/poster")
      .then(res => res.json())
      .then(setPoster)
      .catch(err => console.error(err));

    fetch("http://localhost:3001/api/videos")
      .then(res => res.json())
      .then(setVideos)
      .catch(err => console.error(err));
  }, []);

  // Inicializar animaciones después de que el componente se monte
  useEffect(() => {
    // Esperar a que los datos se carguen y el DOM se actualice
    const timer = setTimeout(() => {
      if (window.initScrollAnimations) {
        window.initScrollAnimations();
      } else {
        // Si la función no está disponible, intentar inicializar directamente
        const script = document.createElement('script');
        script.src = '/src/utils/scroll-animations.js';
        script.onload = () => {
          if (window.initScrollAnimations) {
            window.initScrollAnimations();
          }
        };
        document.head.appendChild(script);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [inicio, categorias, competencia, poster, videos]);

  // Rotación automática del carrusel de logros
  useEffect(() => {
    if (categorias.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % categorias.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [categorias]);

  return (
    <>
      <main className={styles.dashboardMain}>
        {/* HERO SECTION */}
        <section 
          ref={heroRef}
          className={styles.heroSection}
          style={{ backgroundImage: inicio ? `url(http://localhost:3001${inicio.Imagen})` : 'none' }}
        >
          <div className={styles.heroOverlay}>
            <div className={styles.heroText}>
              <h1>{inicio?.Descripcion || "Powerlifting Profesional"}</h1>
              <p>Descubre el mundo del powerlifting de competición</p>
              <div className={styles.heroCta}>
                <a href="#competencias" className={`${styles.ctaButton} ${styles.ctaPrimary}`}>
                  Ver Competencias
                </a>
                <a href="#videos" className={`${styles.ctaButton} ${styles.ctaSecondary}`}>
                  Ver Videos
                </a>
              </div>
            </div>
          </div>
          <div className={styles.scrollIndicator}></div>
        </section>

        {/* POWERLIFTING INFO */}
        <section ref={powerliftingRef} className={styles.powerliftingInfo}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.logrosTitle}>¿Qué es el Powerlifting?</h2>
          </div>
          <div className={styles.descripcion}>
            <p>El powerlifting es un deporte de fuerza que se basa en levantar el mayor peso posible en tres movimientos:</p>
          </div>
          <div className={styles.movimientos}>
            <div className={styles.mov}>
              <img src={sentadilla} alt="Sentadilla" />
              <p>Sentadilla</p>
            </div>
            <div className={styles.mov}>
              <img src={press} alt="Press de Banca" />
              <p>Press de Banca</p>
            </div>
            <div className={styles.mov}>
              <img src={pesomuerto} alt="Peso Muerto" />
              <p>Peso Muerto</p>
            </div>
          </div>
          <div className={styles.descripcion}>
            <p>Cada atleta tiene tres intentos por levantamiento y su mejor intento en cada uno se suma para obtener un total. Es un deporte que requiere técnica, constancia y mucha disciplina.</p>
          </div>
        </section>

        {/* LOGROS SECTION */}
        {categorias.length > 0 && (
          <section ref={logrosRef} className={styles.logrosSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.logrosTitle}>LOGROS DESTACADOS</h2>
            </div>
            <div className={styles.carouselContainer}>
              <div className={styles.carouselSlide}>
                <div className={styles.competitors}>
                  <h3>{categorias[activeIndex].nombre}</h3>
                  {categorias[activeIndex].ganadores.map((c) => (
                    <div key={c.id} className={styles.competitor}>
                      <img
                        src={medallasMap[c.medalla]}
                        alt={`Medalla ${c.medalla}`}
                        className={styles.medallaIcon}
                      />
                      <span>{`${c.nombre} - ${c.peso}`}</span>
                    </div>
                  ))}
                </div>
                <div
                  className={styles.competenciaImgWrapper}
                  style={{
                    backgroundImage: `url(http://localhost:3001${categorias[activeIndex].imagen})`,
                  }}
                >
                  <div className={styles.imageOverlay}></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PRÓXIMA COMPETENCIA */}
        {competencia && (
          <section ref={competenciaRef} id="competencias" className={styles.competenciaSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.logrosTitle}>Próxima Competencia</h2>
            </div>
            <p className={styles.descripcion}>¡No te pierdas nuestra siguiente competencia! Aquí te dejamos los detalles principales:</p>

            <div className={`${styles.card} ${styles.cardCompetencia}`}>
              <div className={styles.texto}>
                <h3 className={styles.nombreCompetencia}>{competencia.nombre}</h3>

                <div className={styles.detallesCompetencia}>
                  <p><strong>Tipo:</strong> {competencia.tipo}</p>
                  <p><strong>Categoría:</strong> {competencia.categoria}</p>
                  <p><strong>Costo:</strong> ${competencia.costo}</p>
                </div>

                {/* Calendario de Fechas */}
                <div className={styles.calendario}>
                  <div className={styles.fechaItem}>
                    <span className={styles.etiqueta}>Inicio Inscripciones</span>
                    <span className={styles.fecha}>
                      {new Date(competencia.fecha_inicio).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <div className={styles.fechaItem}>
                    <span className={styles.etiqueta}>Cierre Inscripciones</span>
                    <span className={styles.fecha}>
                      {new Date(competencia.fecha_cierre).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <div className={styles.fechaItem}>
                    <span className={styles.etiqueta}>Fecha del Evento</span>
                    <span className={styles.fechaEvento}>
                      {new Date(competencia.fecha_evento).toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Imagen de la competencia */}
              {competencia.foto && (
                <img
                  src={`http://localhost:3001${competencia.foto}`}
                  alt={competencia.nombre}
                  className={styles.imagenCompetencia}
                />
              )}
            </div>

            {/* Mapa embebido */}
            <div className={styles.mapaContainer}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3766.8694359667397!2d-98.9466476247904!3d19.24452118199507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTnCsDE0JzQwLjMiTiA5OMKwNTYnMzguNyJX!5e0!3m2!1ses!2smx!4v1761276700501!5m2!1ses!2smx"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de la competencia"
              ></iframe>
            </div>
          </section>
        )}

        {/* POSTER SECTION */}
        {poster && (
          <section ref={posterRef} className={styles.posterSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.logrosTitle}>Póster de Competencia</h2>
            </div>
            <p className={styles.descripcion}>Mira el póster oficial de nuestra próxima competencia:</p>
            <div className={styles.posterContainer}>
              <img src={`http://localhost:3001${poster.imagen_url}`} alt="Póster de competencia" />
            </div>
          </section>
        )}

        {/* VIDEOS SECTION */}
        {videos.length > 0 && (
          <section ref={videosRef} id="videos" className={styles.videosSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.logrosTitle}>Videos de Competencias</h2>
            </div>
            <p className={styles.descripcion}>Revive momentos de nuestras competencias pasadas:</p>
            <div className={styles.videosGrid}>
              {videos.map((v) => {
                if (v.videoLocal)
                  return (
                    <video key={v.id} width="320" height="180" controls className={styles.videoCard}>
                      <source src={`http://localhost:3001${v.videoLocal}`} type="video/mp4" />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  );
                if (v.linkVideo)
                  return (
                    <iframe
                      key={v.id}
                      width="320"
                      height="180"
                      src={v.linkVideo}
                      title={`Video ${v.id}`}
                      allowFullScreen
                      className={styles.videoCard}
                    />
                  );
                return null;
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
};

export default InicioUsuarios;