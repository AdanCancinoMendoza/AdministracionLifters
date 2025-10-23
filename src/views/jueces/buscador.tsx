import React, { useEffect, useMemo, useState } from "react";
import styles from "../../styles/BuscadorJuez.module.css";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import { FaSearch } from "react-icons/fa";

type Ejercicio = {
  nombre: string;
  resultados: string[];
  tiempos: number[];
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

  useEffect(() => {
    fetch("http://localhost:3001/api/competidor")
      .then((res) => res.json())
      .then((data) => {
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
      .catch((err) => console.error(err));
  }, []);

  const resultados = useMemo(() => {
    return competidores.filter(
      (c) =>
        (filtroCategoria === "Todos" || c.categoria === filtroCategoria) &&
        c.nombre.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [competidores, query, filtroCategoria]);

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Buscador de Competidores</h1>
          <p className={styles.subtitle}>
            Busca por nombre al competidor y filtra por categoría.
          </p>
        </header>

        <section className={styles.search}>
          <div className={styles.searchInput}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Buscar competidor por nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar competidor"
            />
          </div>

          <select
            className={styles.selectCategoria}
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

        <section className={styles.results}>
          {resultados.length === 0 ? (
            <div className={styles.empty}>No se encontraron competidores</div>
          ) : (
            resultados.map((c) => (
              <article
                key={c.id_competidor}
                className={styles.item}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(c);
                }}
              >
                <div className={styles.itemLeft}>
                  <div className={styles.avatar}>
                    {c.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemName}>
                    {c.nombre} {c.apellidos}
                  </div>
                  <div className={styles.itemMeta}>
                    {c.peso} — {c.categoria}
                  </div>
                </div>
                <div className={styles.itemAction}>Detalles →</div>
              </article>
            ))
          )}
        </section>
      </main>

      {selected && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalles de ${selected.nombre}`}
          onClick={() => setSelected(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="document">
            <header className={styles.modalHeader}>
              <h2>{selected.nombre} {selected.apellidos}</h2>
              <button className={styles.modalClose} onClick={() => setSelected(null)} aria-label="Cerrar">
                ✕
              </button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.modalMeta}>
                <span className={styles.modalPeso}>
                  Peso: {selected.peso} — {selected.categoria}
                </span>
              </div>
              <div className={styles.ejercicios}>
                {selected.ejercicios.map((ej) => (
                  <div key={ej.nombre} className={styles.ejercicioCard}>
                    <div className={styles.ejercicioTitle}>{ej.nombre}</div>
                    <ul className={styles.ejercicioList}>
                      {ej.resultados.map((res, i) => {
                        const tiempo = ej.tiempos[i];
                        const estado = tiempo > 60 ? "Reprobado (tiempo > 1 min)" : res;
                        return (
                          <li key={i} className={styles.ejercicioItem}>
                            <strong>R{i + 1}:</strong> {estado} —{" "}
                            <span className={styles.ejercicioTiempo}>{tiempo}s</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <button className={styles.btnCerrar} onClick={() => setSelected(null)}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}

      <BottomNavigationMenuCentral selected="buscador" />
    </div>
  );
};

export default Buscador;
