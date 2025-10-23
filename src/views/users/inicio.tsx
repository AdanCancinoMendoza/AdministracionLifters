import React, { useEffect, useState } from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/UsersInicio.module.css";

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
  oro: "https://upload.wikimedia.org/wikipedia/commons/4/44/Gold_medal_icon.svg",
  plata: "https://upload.wikimedia.org/wikipedia/commons/9/99/Silver_medal_icon.svg",
  bronce: "https://upload.wikimedia.org/wikipedia/commons/8/87/Bronze_medal_icon.svg",
};

const InicioUsuarios: React.FC = () => {
  const [inicio, setInicio] = useState<Inicio | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [poster, setPoster] = useState<Poster | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch data from APIs
  useEffect(() => {
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

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % categorias.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + categorias.length) % categorias.length);

  return (
    <>
      <main className={styles.dashboardMain}>
        {/* HERO */}
        {inicio && (
          <section
            className={styles.heroSection}
            style={{ backgroundImage: `url(http://localhost:3001${inicio.Imagen})` }}
          >
            <h1>{inicio.Descripcion}</h1>
          </section>
        )}

        {/* LOGROS */}
        {categorias.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Logros</h2>
            <div className={styles.carouselContainer}>
              <button onClick={prevSlide} className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}>◀</button>
              <button onClick={nextSlide} className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}>▶</button>

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
                <div className={styles.competenciaImg}>
                  <img
                    src={`http://localhost:3001${categorias[activeIndex].imagen}`}
                    alt={categorias[activeIndex].nombre}
                  />
                </div>
              </div>
            </div>
          </>
        )}

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
        {competencia && (
          <>
            <h2 className={styles.sectionTitle}>Próxima Competencia</h2>
            <div className={`${styles.card} ${styles.cardCompetencia}`}>
              <div className={styles.texto}>
                <p>📅 <strong>Fecha:</strong> {new Date(competencia.fecha_evento).toLocaleDateString()}</p>
                <p>📍 <strong>Lugar:</strong> {competencia.ubicacion}</p>
                <p>🔔 <strong>Detalles:</strong> Tipo: {competencia.tipo}, Costo: ${competencia.costo}</p>
              </div>
              {competencia.foto && <img src={`http://localhost:3001${competencia.foto}`} alt={competencia.nombre} />}
            </div>
          </>
        )}

        {/* Poster */}
        {poster && (
          <div className={styles.posterContainer}>
            <img src={`http://localhost:3001${poster.imagen_url}`} alt="Póster de competencia" />
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Videos de Competencias</h2>
            <div className={`${styles.card} ${styles.cardVideos}`}>
              <p>Revive momentos de nuestras competencias pasadas:</p>
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
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
};

export default InicioUsuarios;
