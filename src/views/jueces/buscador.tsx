import React, { useEffect, useMemo, useState } from "react";
import "../../styles/buscadorJuez.css";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import { FaSearch } from "react-icons/fa";

type Ejercicio = {
  nombre: string;
  resultados: string[]; // Aprobado / Reprobado / Faltante
  tiempos: number[]; // segundos por intento
};

type CompetidorDetalle = {
  id_competidor: number;
  nombre: string;
  apellidos: string;
  peso: string;
  categoria: string;
  ejercicios: Ejercicio[];
};

const CATEGORIAS = ["Todos", "Peso Pluma", "Ligero", "Medio", "Pesado", "Superpesado"];

const NOMBRES_EJERCICIOS = ["Press Banca", "Peso Muerto", "Sentadilla"];

const Buscador: React.FC = () => {
  const [competidores, setCompetidores] = useState<CompetidorDetalle[]>([]);
  const [query, setQuery] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [selected, setSelected] = useState<CompetidorDetalle | null>(null);

  // ⚡ Cargar competidores desde la API
  useEffect(() => {
    fetch("http://localhost:3001/api/competidor")
      .then((res) => res.json())
      .then((data) => {
        // Mapear los competidores agregando ejercicios por defecto
        const mapped: CompetidorDetalle[] = data.map((c: any) => ({
          id_competidor: c.id_competidor,
          nombre: c.nombre,
          apellidos: c.apellidos,
          peso: c.peso + "kg",
          categoria: c.categoria,
          ejercicios: NOMBRES_EJERCICIOS.map((ej) => ({
            nombre: ej,
            resultados: ["Faltante", "Faltante", "Faltante"],
            tiempos: [0, 0, 0],
          })),
        }));
        setCompetidores(mapped);
      })
      .catch((err) => console.error("Error al obtener competidores:", err));
  }, []);

  // Filtrar por nombre y categoría
  const resultados = useMemo(() => {
    return competidores.filter(
      (c) =>
        (filtroCategoria === "Todos" || c.categoria === filtroCategoria) &&
        c.nombre.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [competidores, query, filtroCategoria]);

  return (
    <div className="buscador-juez-root">
      <main className="buscador-juez-main">
        <header className="buscador-juez-header">
          <h1 className="buscador-juez-title">Buscador de Competidores</h1>
          <p className="buscador-juez-subtitle">
            Busca por nombre al competidor y filtra por categoría.
          </p>
        </header>

        <section className="buscador-juez-search">
          <div className="buscador-juez-search-input">
            <FaSearch className="buscador-juez-search-icon" />
            <input
              type="search"
              placeholder="Buscar competidor por nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar competidor"
            />
          </div>

          <select
            className="buscador-juez-filtro-categoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </section>

        <section className="buscador-juez-results">
          {resultados.length === 0 ? (
            <div className="buscador-juez-empty">No se encontraron competidores</div>
          ) : (
            resultados.map((c) => (
              <article
                key={c.id_competidor}
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
                    {c.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                </div>
                <div className="buscador-juez-item-body">
                  <div className="buscador-juez-item-name">
                    {c.nombre} {c.apellidos}
                  </div>
                  <div className="buscador-juez-item-meta">
                    {c.peso} — {c.categoria}
                  </div>
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
              <h2>
                {selected.nombre} {selected.apellidos}
              </h2>
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
                <span className="buscador-juez-modal-peso">
                  Peso: {selected.peso} — {selected.categoria}
                </span>
              </div>

              <div className="buscador-juez-ejercicios">
                {selected.ejercicios.map((ej) => (
                  <div key={ej.nombre} className="buscador-juez-ejercicio-card">
                    <div className="buscador-juez-ejercicio-title">{ej.nombre}</div>
                    <ul className="buscador-juez-ejercicio-list">
                      {ej.resultados.map((res, i) => {
                        const tiempo = ej.tiempos[i];
                        const estado = tiempo > 60 ? "Reprobado (tiempo > 1 min)" : res;
                        return (
                          <li key={i} className="buscador-juez-ejercicio-item">
                            <strong>R{i + 1}:</strong> {estado} —{" "}
                            <span className="buscador-juez-ejercicio-tiempo">{tiempo}s</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <footer className="buscador-juez-modal-footer">
              <button className="buscador-juez-btn cerrar" onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}

      <BottomNavigationMenuCentral selected="buscador" />
    </div>
  );
};

export default Buscador;
