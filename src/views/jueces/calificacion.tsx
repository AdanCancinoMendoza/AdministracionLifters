import React, { useEffect, useState } from "react";
import { FaFlag, FaFlagCheckered } from "react-icons/fa";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import "../../styles/calificarJuez.css";

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

  // --- Temporizador ---
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

  // --- Avanzar ---
  const avanzarSiguiente = () => {
    setCanCalificar(true);
    if (currentEjercicioIndex < currentCompetidor.ejercicios.length - 1) {
      setCurrentEjercicioIndex((prev) => prev + 1);
    } else {
      if (currentIndex < competidores.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setCurrentEjercicioIndex(0);
      } else {
        setCurrentIndex(0);
        setCurrentEjercicioIndex(0);
      }
    }
  };

  // --- Calificar ---
  const calificar = (tipo: "Bueno" | "Malo") => {
    if (!canCalificar) return;

    const nuevosCompetidores = [...competidores];
    const actual = nuevosCompetidores[currentIndex];
    actual.ejercicios[currentEjercicioIndex].calificaciones = actual.ejercicios[
      currentEjercicioIndex
    ].calificaciones.map(() => tipo);
    setCompetidores(nuevosCompetidores);
    setCanCalificar(false);
  };

  return (
    <div className="calificar-screen">
      <div className="calificar-container">
        <h1 className="calificar-titulo">Calificación de Competidores</h1>

        <h2 className="calificar-subtitulo">
          {currentCompetidor.categoria} | {currentCompetidor.nombre}
        </h2>

        <div className="calificar-tiempo">
          <p>Tiempo restante</p>
          <span>{timeLeft}s</span>
        </div>

        <div className="calificar-lista-ejercicios">
          {currentCompetidor.ejercicios.map((ejercicio, i) => (
            <div
              key={i}
              className={`calificar-ejercicio ${
                i === currentEjercicioIndex ? "activo" : ""
              }`}
            >
              <h3>{ejercicio.nombre}</h3>
              <div className="calificar-intentos">
                {ejercicio.calificaciones.map((cal, idx) => (
                  <div
                    key={idx}
                    className={`intento-circle ${
                      cal === "Bueno"
                        ? "bueno"
                        : cal === "Malo"
                        ? "malo"
                        : "pendiente"
                    }`}
                  ></div>
                ))}
              </div>
              {i === currentEjercicioIndex && (
                <p className="texto-activo">
                  Ejercicio activo para calificación
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="calificar-botones">
          <button
            className="btn-calificar malo"
            onClick={() => calificar("Malo")}
            disabled={!canCalificar}
          >
            <FaFlag color="white" size={22} />
            <span>Malo</span>
          </button>

          <button
            className="btn-calificar bueno"
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
