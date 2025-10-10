import React, { useMemo, useState } from "react";
import "../../styles/buscadorJuez.css";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import { FaSearch } from "react-icons/fa";

type Ejercicio = {
  nombre: string;
  resultados: string[];
  tiempos: number[]; // segundos por intento
};

type CompetidorDetalle = {
  nombre: string;
  peso: string;
  ejercicios: Ejercicio[];
};

const SAMPLE_COMPETIDORES: CompetidorDetalle[] = [
  {
    nombre: "Juan Pérez",
    peso: "80kg",
    ejercicios: [
      { nombre: "Press Banca", resultados: ["Aprobado", "Mala", "Faltante"], tiempos: [50, 70, 65] },
      { nombre: "Peso Muerto", resultados: ["Aprobado", "Aprobado", "Faltante"], tiempos: [55, 60, 75] },
      { nombre: "Sentadilla", resultados: ["Aprobado", "Mala", "Faltante"], tiempos: [58, 62, 80] },
    ],
  },
  {
    nombre: "Ana López",
    peso: "65kg",
    ejercicios: [
      { nombre: "Press Banca", resultados: ["Mala", "Aprobado", "Faltante"], tiempos: [70, 65, 80] },
      { nombre: "Peso Muerto", resultados: ["Aprobado", "Aprobado", "Aprobado"], tiempos: [55, 59, 50] },
      { nombre: "Sentadilla", resultados: ["Mala", "Mala", "Faltante"], tiempos: [62, 66, 75] },
    ],
  },
  // puedes añadir más datos de ejemplo aquí
];

const Buscador: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CompetidorDetalle | null>(null);

  const resultados = useMemo(
    () =>
      SAMPLE_COMPETIDORES.filter((c) =>
        c.nombre.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query]
  );

  return (
    <div className="buscador-juez-root">
      <main className="buscador-juez-main">
        <header className="buscador-juez-header">
          <h1 className="buscador-juez-title">Buscador de Competidores</h1>
          <p className="buscador-juez-subtitle">
            Busca por nombre al competidor y consulta sus resultados.
          </p>
        </header>

        <section className="buscador-juez-search">
          <label htmlFor="buscador-input" className="buscador-juez-label">
            <FaSearch className="buscador-juez-search-icon" />
            <input
              id="buscador-input"
              className="buscador-juez-input"
              type="search"
              placeholder="Buscar competidor por nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar competidor"
            />
          </label>
        </section>

        <section className="buscador-juez-results">
          {resultados.length === 0 ? (
            <div className="buscador-juez-empty">No se encontraron competidores</div>
          ) : (
            resultados.map((c) => (
              <article
                key={c.nombre}
                className="buscador-juez-item"
                role="button"
                tabIndex={0}
                onClick={() => setSelected(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(c);
                }}
              >
                <div className="buscador-juez-item-left">
                  <div className="buscador-juez-avatar" aria-hidden>
                    {c.nombre.split(" ").map((n) => n[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                </div>
                <div className="buscador-juez-item-body">
                  <div className="buscador-juez-item-name">{c.nombre}</div>
                  <div className="buscador-juez-item-meta">{c.peso}</div>
                </div>
                <div className="buscador-juez-item-action">Detalles →</div>
              </article>
            ))
          )}
        </section>
      </main>

      {/* Modal de detalles */}
      {selected && (
        <div
          className="buscador-juez-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalles de ${selected.nombre}`}
          onClick={() => setSelected(null)}
        >
          <div
            className="buscador-juez-modal"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <header className="buscador-juez-modal-header">
              <h2>{selected.nombre}</h2>
              <button
                className="buscador-juez-modal-close"
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </header>

            <div className="buscador-juez-modal-body">
              <div className="buscador-juez-modal-meta">
                <span className="buscador-juez-modal-peso">Peso: {selected.peso}</span>
              </div>

              <div className="buscador-juez-ejercicios">
                {selected.ejercicios.map((ej, idx) => (
                  <div key={ej.nombre} className="buscador-juez-ejercicio-card">
                    <div className="buscador-juez-ejercicio-title">{ej.nombre}</div>
                    <ul className="buscador-juez-ejercicio-list">
                      {ej.resultados.map((res, i) => {
                        const tiempo = ej.tiempos[i];
                        const estado = tiempo > 60 ? "Reprobado (tiempo > 1 min)" : res;
                        return (
                          <li key={i} className="buscador-juez-ejercicio-item">
                            <strong>R{i + 1}:</strong> {estado} — <span className="buscador-juez-ejercicio-tiempo">{tiempo}s</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <footer className="buscador-juez-modal-footer">
              <button
                className="buscador-juez-btn cerrar"
                onClick={() => setSelected(null)}
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Menu inferior (reutiliza tu componente) */}
      <BottomNavigationMenuCentral selected="buscador" />
    </div>
  );
};

export default Buscador;
