// src/views/jueces/Buscador.tsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "../../styles/BuscadorJuez.module.css";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LoadingModalJuez from "./LoadingModalJuez"; // <-- modal reutilizable

type Attempt = {
  id: number;
  id_competencia: number;
  id_competidor: number;
  exercise_id: number;
  module_id: number | null;
  attempt_number: number;
  weight_kg: string | null;
  approved: number | null;
  judge_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Competidor = {
  id_competidor: number;
  nombre: string;
  apellidos?: string;
  peso?: string | null;
  categoria?: string | null;
  id_competencia: number;
  [k: string]: any;
};

const API_BASE = "http://localhost:3001";
const COMPETITORS_API = `${API_BASE}/api/competidor`;
const MODULES_API = `${API_BASE}/api/modules`;
const ATTEMPTS_API = `${API_BASE}/api/attempts`;
const COMPETITIONS_API = `${API_BASE}/api/competenciasadmin`;

const EXERCISE_ID_TO_NAME: Record<number, string> = { 1: "Press Banca", 2: "Peso Muerto", 3: "Sentadilla" };

type Props = {
  userJuez?: any | null;
  setUserJuez?: (j: any | null) => void;
};

const Buscador: React.FC<Props> = ({ userJuez: propUserJuez, setUserJuez: propSetUserJuez }) => {
  const navigate = useNavigate();

  const [userJuez, setUserJuez] = useState<any | null>(propUserJuez ?? null);
  const [competition, setCompetition] = useState<any | null>(null);

  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});

  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("Todos");

  const [selectedCompetitor, setSelectedCompetitor] = useState<Competidor | null>(null);
  const [attemptsForSelected, setAttemptsForSelected] = useState<Attempt[] | null>(null);
  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(false);

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // inicializar userJuez: primero props, si no existe usar localStorage
  useEffect(() => {
    if (propUserJuez) {
      setUserJuez(propUserJuez);
      return;
    }
    try {
      const raw = localStorage.getItem("userJuez");
      if (!raw) {
        navigate("/jueces/login");
        return;
      }
      const parsed = JSON.parse(raw);
      setUserJuez(parsed);
      if (propSetUserJuez) propSetUserJuez(parsed);
    } catch (err) {
      navigate("/jueces/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propUserJuez]);

  // Cargar datos relacionados a la competencia del juez
  useEffect(() => {
    if (!userJuez) return;
    const ac = new AbortController();
    let mounted = true;
    setLoadingData(true);
    setError(null);

    (async () => {
      try {
        const compId = Number(userJuez.id_competencia);
        // obtener info de competencia (opcional)
        try {
          const respC = await fetch(`${COMPETITIONS_API}/${compId}`, { signal: ac.signal });
          if (respC.ok) {
            const jsonC = await respC.json();
            if (mounted) setCompetition(jsonC);
          }
        } catch {
          // ignore
        }

        // competidores
        const resp = await fetch(COMPETITORS_API, { signal: ac.signal });
        if (!resp.ok) throw new Error("No se pudieron obtener competidores");
        const allCompetidores: Competidor[] = await resp.json();
        const filtered = allCompetidores.filter((c) => Number(c.id_competencia) === compId);
        if (mounted) setCompetidores(filtered);

        // módulos
        const respM = await fetch(`${MODULES_API}?competition_id=${compId}`, { signal: ac.signal });
        if (!respM.ok) {
          if (mounted) {
            setModules([]);
            setAssignments({});
          }
        } else {
          const mods = await respM.json();
          if (mounted) setModules(mods);

          // assignments por módulo
          const assignMap: Record<number, string[]> = {};
          await Promise.all(
            mods.map(async (m: any) => {
              try {
                const r = await fetch(`${MODULES_API}/${m.id}/assignments`, { signal: ac.signal });
                if (!r.ok) {
                  assignMap[m.id] = [];
                  return;
                }
                const a = await r.json();
                assignMap[m.id] = (a || []).map((x: any) => String(x.id_competidor));
              } catch {
                assignMap[m.id] = [];
              }
            })
          );
          if (mounted) setAssignments(assignMap);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          if (mounted) setError(err.message ?? "Error cargando datos");
        }
      } finally {
        if (mounted) setLoadingData(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [userJuez, navigate]);

  // Lista filtrada por búsqueda y por módulo
  const resultados = useMemo(() => {
    let base = competidores;

    if (moduleFilter && moduleFilter !== "Todos") {
      const mid = Number(moduleFilter);
      const assigned = assignments[mid] ?? [];
      base = base.filter((c) => assigned.includes(String(c.id_competidor)));
    }

    if (!query || query.trim() === "") return base;

    const q = query.trim().toLowerCase();
    return base.filter(
      (c) =>
        (c.nombre || "").toLowerCase().includes(q) ||
        ((c.apellidos || "").toLowerCase().includes(q)) ||
        ((c.peso || "") + "").toLowerCase().includes(q) ||
        ((c.categoria || "") + "").toLowerCase().includes(q)
    );
  }, [competidores, moduleFilter, query, assignments]);

  // Al seleccionar un competidor -> cargar attempts
  useEffect(() => {
    if (!selectedCompetitor || !userJuez) {
      setAttemptsForSelected(null);
      return;
    }

    let mounted = true;
    setLoadingAttempts(true);
    setAttemptsForSelected(null);

    const compId = Number(userJuez.id_competencia);
    const competitorId = Number(selectedCompetitor.id_competidor);

    (async () => {
      try {
        const url = `${ATTEMPTS_API}/by-competitor?id_competencia=${compId}&id_competidor=${competitorId}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          if (mounted) setAttemptsForSelected([]);
          return;
        }
        const arr: Attempt[] = await resp.json();
        if (mounted) setAttemptsForSelected(arr);
      } catch (err) {
        console.error("Error al cargar attempts:", err);
        if (mounted) setAttemptsForSelected([]);
      } finally {
        if (mounted) setLoadingAttempts(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedCompetitor, userJuez]);

  const formatPeso = (p?: string | null) => (p == null || p === "" ? "—" : `${Number(p).toFixed(2)} kg`);
  const nameOf = (c?: Competidor | null) => (!c ? "—" : `${c.nombre}${c.apellidos ? " " + c.apellidos : ""}`);

  // organizar attempts por exercise
  const attemptsByExercise = (() => {
    if (!attemptsForSelected) return null;
    const map: Record<number, (Attempt | null)[]> = {};
    [1, 2, 3].forEach((exId) => (map[exId] = [null, null, null]));
    attemptsForSelected.forEach((a) => {
      const arr = map[a.exercise_id] ?? [null, null, null];
      arr[a.attempt_number - 1] = a;
      map[a.exercise_id] = arr;
    });
    return map;
  })();

  // Si no hay user (redirigir ya), mostramos null
  if (!userJuez) return null;
  // Mantengo el return de error temprano (para no intentar renderizar UI normal si hay error severo)
  if (error) return <div className={styles.root}><main className={styles.main}><p style={{ color: "red" }}>{error}</p></main></div>;

  // header: mostrar nombre de competencia si existe, o "ID <número>" (nunca undefined)
  const compIdToShow = userJuez?.id_competencia ? String(userJuez.id_competencia) : "—";
  const compLabel = competition?.nombre ? competition.nombre : `ID ${compIdToShow}`;

  return (
    <div className={styles.root}>
      {/* Modal de carga global (reemplaza el texto Cargando...) */}
      <LoadingModalJuez open={loadingData} message="Cargando datos de la competencia..." variant="spinner" />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Buscador de Competidores</h1>
          <p className={styles.subtitle}>
            Competencia: <strong>{compLabel}</strong>
          </p>
        </header>

        <section className={styles.search}>
          <div className={styles.searchInput}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Buscar competidor por nombre, peso o categoría"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar competidor"
            />
          </div>

          <select
            className={styles.selectCategoria}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="Todos">Todos los módulos</option>
            {modules.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.title ?? `Módulo ${m.id}`}
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
                onClick={() => setSelectedCompetitor(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedCompetitor(c);
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
                    {formatPeso(c.peso)} — {c.categoria ?? "—"}
                  </div>
                </div>
                <div className={styles.itemAction}>Detalles →</div>
              </article>
            ))
          )}
        </section>
      </main>

      {/* Modal de detalles del competidor - ahora usa variante pequeña (modalSmall) */}
      {selectedCompetitor && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalles de ${selectedCompetitor.nombre}`}
          onClick={() => { setSelectedCompetitor(null); setAttemptsForSelected(null); }}
        >
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()} role="document">
            <header className={styles.modalHeader}>
              <h2>{selectedCompetitor.nombre} {selectedCompetitor.apellidos}</h2>
              <button className={styles.modalClose} onClick={() => { setSelectedCompetitor(null); setAttemptsForSelected(null); }} aria-label="Cerrar">
                ✕
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.modalMeta}>
                <span className={styles.modalPeso}>
                  Peso: {formatPeso(selectedCompetitor.peso)} — {selectedCompetitor.categoria ?? "—"}
                </span>
              </div>

              <div className={styles.ejercicios}>
                {loadingAttempts && <p>Cargando intentos...</p>}

                {!loadingAttempts && attemptsForSelected && (
                  <>
                    {([1, 2, 3] as number[]).map((exerciseId) => {
                      const attemptsArr = attemptsByExercise ? attemptsByExercise[exerciseId] : [null, null, null];
                      const exName = EXERCISE_ID_TO_NAME[exerciseId] ?? `Ejercicio ${exerciseId}`;
                      return (
                        <div key={exerciseId} className={styles.ejercicioCard}>
                          <div className={styles.ejercicioTitle}>{exName}</div>
                          <ul className={styles.ejercicioList}>
                            {attemptsArr.map((a, idx) => {
                              if (!a) {
                                return (
                                  <li key={idx} className={styles.ejercicioItem}>
                                    <strong>R{idx + 1}:</strong> — (sin registro)
                                  </li>
                                );
                              }
                              const approvedLabel = a.approved === 1 ? "Aprobado" : a.approved === 0 ? "Reprobado" : "Pendiente";
                              return (
                                <li key={idx} className={styles.ejercicioItem}>
                                  <strong>R{a.attempt_number}:</strong> {a.weight_kg ?? "—"} kg — <em>{approvedLabel}</em>
                                  <div style={{ fontSize: 12, color: "#666" }}>{new Date(a.updated_at).toLocaleString()}</div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </>
                )}

                {!loadingAttempts && attemptsForSelected && attemptsForSelected.length === 0 && (
                  <div className={styles.empty}>No hay intentos registrados para este competidor</div>
                )}

                {!loadingAttempts && attemptsForSelected === null && (
                  <div className={styles.empty}>Selecciona un competidor para ver sus intentos</div>
                )}
              </div>
            </div>

            <footer className={styles.modalFooter}>
              <button className={styles.btnCerrar} onClick={() => { setSelectedCompetitor(null); setAttemptsForSelected(null); }}>
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
