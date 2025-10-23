import React, { useEffect, useState } from "react";
import { FaFlag, FaFlagCheckered } from "react-icons/fa";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import styles from "../../styles/CalificarJuez.module.css";

interface EjercicioCalificar {
  nombre: string;
  calificaciones: (string | null)[];
}

interface CompetidorCalificacion {
  nombre: string;
  categoria: string;
  ejercicios: EjercicioCalificar[];
}

const CalificarScreen: React.FC = () => {
  const [competidores, setCompetidores] = useState<CompetidorCalificacion[]>([
    {
      nombre: "Juan Pérez",
      categoria: "-60kg",
      ejercicios: [
        { nombre: "Press Banca", calificaciones: [null, null, null] },
        { nombre: "Sentadilla", calificaciones: [null, null, null] },
        { nombre: "Peso Muerto", calificaciones: [null, null, null] },
      ],
    },
    {
      nombre: "Ana López",
      categoria: "-70kg",
      ejercicios: [
        { nombre: "Press Banca", calificaciones: [null, null, null] },
        { nombre: "Sentadilla", calificaciones: [null, null, null] },
        { nombre: "Peso Muerto", calificaciones: [null, null, null] },
      ],
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEjercicioIndex, setCurrentEjercicioIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canCalificar, setCanCalificar] = useState(true);

  const currentCompetidor = competidores[currentIndex];

  // Temporizador
  useEffect(() => {
    setTimeLeft(60);
    setCanCalificar(true);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          avanzarSiguiente();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, currentEjercicioIndex]);

  const avanzarSiguiente = () => {
    setCanCalificar(true);
    if (currentEjercicioIndex < currentCompetidor.ejercicios.length - 1) {
      setCurrentEjercicioIndex((prev) => prev + 1);
    } else if (currentIndex < competidores.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentEjercicioIndex(0);
    } else {
      setCurrentIndex(0);
      setCurrentEjercicioIndex(0);
    }
  };

  const calificar = (tipo: "Bueno" | "Malo") => {
    if (!canCalificar) return;

    const nuevosCompetidores = [...competidores];
    nuevosCompetidores[currentIndex].ejercicios[currentEjercicioIndex].calificaciones =
      nuevosCompetidores[currentIndex].ejercicios[currentEjercicioIndex].calificaciones.map(
        () => tipo
      );

    setCompetidores(nuevosCompetidores);
    setCanCalificar(false);
  };

  return (
    <div className={styles.calificarScreen}>
      <div className={styles.calificarContainer}>
        <h1 className={styles.calificarTitulo}>Calificación de Competidores</h1>

        <h2 className={styles.calificarSubtitulo}>
          {currentCompetidor.categoria} | {currentCompetidor.nombre}
        </h2>

        <div className={styles.calificarTiempo}>
          <p>Tiempo restante</p>
          <span>{timeLeft}s</span>
        </div>

        <div className={styles.calificarListaEjercicios}>
          {currentCompetidor.ejercicios.map((ejercicio, i) => (
            <div
              key={i}
              className={`${styles.calificarEjercicio} ${
                i === currentEjercicioIndex ? styles.activo : ""
              }`}
            >
              <h3>{ejercicio.nombre}</h3>
              <div className={styles.calificarIntentos}>
                {ejercicio.calificaciones.map((cal, idx) => (
                  <div
                    key={idx}
                    className={`${styles.intentoCircle} ${
                      cal === "Bueno"
                        ? styles.bueno
                        : cal === "Malo"
                        ? styles.malo
                        : styles.pendiente
                    }`}
                  ></div>
                ))}
              </div>
              {i === currentEjercicioIndex && (
                <p className={styles.textoActivo}>Ejercicio activo para calificación</p>
              )}
            </div>
          ))}
        </div>

        <div className={styles.calificarBotones}>
          <button
            className={`${styles.btnCalificar} ${styles.malo}`}
            onClick={() => calificar("Malo")}
            disabled={!canCalificar}
          >
            <FaFlag color="white" size={22} />
            <span>Malo</span>
          </button>

          <button
            className={`${styles.btnCalificar} ${styles.bueno}`}
            onClick={() => calificar("Bueno")}
            disabled={!canCalificar}
          >
            <FaFlagCheckered color="white" size={22} />
            <span>Bueno</span>
          </button>
        </div>
      </div>

      <BottomNavigationMenuCentral selected="calificar" />
    </div>
  );
};

export default CalificarScreen;
