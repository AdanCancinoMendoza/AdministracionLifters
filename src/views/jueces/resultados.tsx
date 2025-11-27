// src/views/jueces/ResultadosScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import styles from "../../styles/ResultadosScreen.module.css";
import { useNavigate } from "react-router-dom";
import LoadingModalJuez from "./LoadingModalJuez"; // <-- modal reutilizable

interface Juez {
  id_juez: number;
  id_competencia: number;
  nombre?: string;
  apellidos?: string;
  usuario?: string;
}

interface AttemptApi {
  id: number;
  id_competencia: number;
  id_competidor: number;
  exercise_id: number;
  module_id?: number;
  attempt_number: number;
  weight_kg: string | null;
  approved: number | null;
  judge_id?: number | null;
  notes?: any;
  created_at?: string;
  updated_at?: string;
}

interface Competencia {
  id_competencia: number;
  nombre: string;
  [k: string]: any;
}

interface Competidor {
  id_competidor: number;
  nombre: string;
  apellidos?: string;
  peso?: string | null;
  categoria?: string | null;
  id_competencia: number;
  [k: string]: any;
}

const API_BASE = "http://localhost:3001";
const COMPETITIONS_API = `${API_BASE}/api/competenciasadmin`;
const COMPETITORS_API = `${API_BASE}/api/competidor`;
const MODULES_API = `${API_BASE}/api/modules`;
const ATTEMPTS_BY_COMPETITOR = `${API_BASE}/api/attempts/by-competitor`;
const SOCKET_URL = API_BASE;

const EXERCISE_NAMES: Record<number, string> = { 1: "Press Banca", 2: "Peso Muerto", 3: "Sentadilla" };

type Estado = "APROBADO" | "REPROBADO" | "PENDIENTE";
type Repeticion = { valor: string; estado: Estado; attemptId?: number | null };

const approvedToEstado = (approved: number | boolean | null): Estado =>
  approved === 1 || approved === true ? "APROBADO" : approved === 0 || approved === false ? "REPROBADO" : "PENDIENTE";

const defaultPerExercise = (): Record<number, Repeticion[]> => ({
  1: [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }],
  2: [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }],
  3: [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }],
});

const ResultadosScreen: React.FC<{ userJuez: Juez | null }> = ({ userJuez }) => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  const [juez, setJuez] = useState<Juez | null>(userJuez);
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});
  const [resultsMap, setResultsMap] = useState<Record<number, Record<number, Repeticion[]>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // set juez from prop (redirect to login if absent)
  useEffect(() => {
    if (!userJuez) {
      navigate("/jueces/login");
      return;
    }
    setJuez(userJuez);
  }, [userJuez, navigate]);

  // load competition, competitors, modules, assignments
  useEffect(() => {
    if (!juez) return;
    const ac = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const compRes = await fetch(`${COMPETITIONS_API}/${juez.id_competencia}`, { signal: ac.signal });
        if (compRes.ok) {
          const compJson = await compRes.json();
          setCompetencia(compJson);
        } else {
          // si API falla, dejamos competencia en null (mostramos placeholder en UI)
          setCompetencia(null);
        }

        const competsResp = await fetch(COMPETITORS_API, { signal: ac.signal });
        if (!competsResp.ok) throw new Error("No se pudieron obtener competidores");
        const competsJson: Competidor[] = await competsResp.json();
        const filtered = competsJson.filter((c) => Number(c.id_competencia) === Number(juez.id_competencia));
        setCompetidores(filtered);

        // modules + assignments (optional)
        try {
          const modsResp = await fetch(`${MODULES_API}?competition_id=${juez.id_competencia}`, { signal: ac.signal });
          if (modsResp.ok) {
            const modsJson = await modsResp.json();
            setModules(modsJson);
            const assignMap: Record<number, string[]> = {};
            await Promise.all(
              modsJson.map(async (m: any) => {
                try {
                  const r = await fetch(`${MODULES_API}/${m.id}/assignments`, { signal: ac.signal });
                  if (!r.ok) { assignMap[m.id] = []; return; }
                  const a = await r.json();
                  assignMap[m.id] = (a || []).map((x: any) => String(x.id_competidor));
                } catch { assignMap[m.id] = []; }
              })
            );
            setAssignments(assignMap);
          } else {
            setModules([]);
            setAssignments({});
          }
        } catch {
          setModules([]);
          setAssignments({});
        }
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err?.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => ac.abort();
  }, [juez]);

  // load attempts for each competitor (initial population)
  useEffect(() => {
    if (!competidores || competidores.length === 0 || !juez) {
      return;
    }
    let mounted = true;
    const ac = new AbortController();
    const loadAttempts = async () => {
      setLoadingAttempts(true);
      try {
        const map: Record<number, Record<number, Repeticion[]>> = {};
        await Promise.all(
          competidores.map(async (c) => {
            const perExercise = defaultPerExercise();
            try {
              const url = `${ATTEMPTS_BY_COMPETITOR}?id_competencia=${juez.id_competencia}&id_competidor=${c.id_competidor}`;
              const r = await fetch(url, { signal: ac.signal });
              if (!r.ok) {
                map[c.id_competidor] = perExercise;
                return;
              }
              const arr: AttemptApi[] = await r.json();
              for (const a of arr) {
                const ex = Number(a.exercise_id);
                const slotIdx = Math.max(0, Math.min(2, Number(a.attempt_number) - 1));
                const valor = a.weight_kg ? `${parseFloat(a.weight_kg).toFixed(0)} kg` : "—";
                const estado = approvedToEstado(a.approved);
                perExercise[ex] = perExercise[ex] || [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }];
                perExercise[ex][slotIdx] = { valor, estado, attemptId: a.id ?? null };
              }
            } catch {
              // keep defaults
            } finally {
              map[c.id_competidor] = perExercise;
            }
          })
        );
        if (!mounted) return;
        setResultsMap(map);
      } finally {
        if (mounted) setLoadingAttempts(false);
      }
    };
    void loadAttempts();
    return () => { mounted = false; ac.abort(); };
  }, [competidores, juez]);

  // realtime: socket.io connection to listen for changes
  useEffect(() => {
    if (!juez || !competencia) return;
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => {
      try { s.emit("join", { id_competencia: juez.id_competencia }); } catch {}
    });

    s.on("attempt_update", (payload: any) => {
      if (!payload) return;
      const att: AttemptApi = payload.attempt ?? payload;
      if (!att || Number(att.id_competencia) !== Number(juez.id_competencia)) return;
      handleAttemptUpdate(att);
    });

    s.on("vote_update", (payload: any) => {
      if (!payload) return;
      const att: AttemptApi = payload.attempt ?? payload;
      if (!att || Number(att.id_competencia) !== Number(juez.id_competencia)) return;
      handleAttemptUpdate(att);
    });

    s.on("competitor:selected", () => {
      (async () => {
        try {
          if (!juez) return;
          const map: Record<number, Record<number, Repeticion[]>> = {};
          await Promise.all(
            competidores.map(async (c) => {
              const perExercise = defaultPerExercise();
              try {
                const url = `${ATTEMPTS_BY_COMPETITOR}?id_competencia=${juez.id_competencia}&id_competidor=${c.id_competidor}`;
                const r = await fetch(url);
                if (!r.ok) { map[c.id_competidor] = perExercise; return; }
                const arr: AttemptApi[] = await r.json();
                for (const a of arr) {
                  const ex = Number(a.exercise_id);
                  const slotIdx = Math.max(0, Math.min(2, Number(a.attempt_number) - 1));
                  const valor = a.weight_kg ? `${parseFloat(a.weight_kg).toFixed(0)} kg` : "—";
                  perExercise[ex] = perExercise[ex] || [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }];
                  perExercise[ex][slotIdx] = { valor, estado: approvedToEstado(a.approved), attemptId: a.id ?? null };
                }
              } catch {
                // ignore
              } finally {
                map[c.id_competidor] = perExercise;
              }
            })
          );
          setResultsMap(map);
        } catch {}
      })();
    });

    return () => {
      try { s.emit("leave", { id_competencia: juez.id_competencia }); } catch {}
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juez, competencia, competidores]);

  // function to update the resultsMap for a single attempt
  const handleAttemptUpdate = (a: AttemptApi) => {
    setResultsMap((prev) => {
      const copy: Record<number, Record<number, Repeticion[]>> = { ...prev };
      const compId = Number(a.id_competidor);
      copy[compId] = copy[compId] ? { ...copy[compId] } : defaultPerExercise();
      const ex = Number(a.exercise_id);
      copy[compId][ex] = copy[compId][ex] ? [...copy[compId][ex]] : [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }];
      const slotIdx = Math.max(0, Math.min(2, Number(a.attempt_number) - 1));
      const valor = a.weight_kg ? `${parseFloat(a.weight_kg).toFixed(0)} kg` : "—";
      const estado = approvedToEstado(a.approved);
      copy[compId][ex][slotIdx] = { valor, estado, attemptId: a.id ?? null };
      return copy;
    });
  };

  const getColor = (estado: Estado) => {
    switch (estado) {
      case "APROBADO":
        return "#4CAF50";
      case "REPROBADO":
        return "#F44336";
      case "PENDIENTE":
        return "#03A9F4";
      default:
        return "#BDBDBD";
    }
  };

  const formatPeso = (p?: string | null) => (p == null || p === "" ? "—" : `${Number(p).toFixed(2)} kg`);
  const nameOf = (c?: Competidor | null) => (!c ? "—" : `${c!.nombre}${c!.apellidos ? " " + c!.apellidos : ""}`);

  if (!juez) return <p style={{ color: "#666" }}>Redirigiendo a login...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Error: {error}</p>;

  // mensaje del modal dependiendo si se están cargando datos o intentos
  const modalOpen = loading || loadingAttempts;
  const modalMessage = loading ? "Cargando datos de la competencia..." : "Cargando resultados...";

  return (
    <div className={styles.resultadosScreen}>
      {/* Modal de carga global */}
      <LoadingModalJuez open={modalOpen} message={modalMessage} variant="spinner" />

      <div className={styles.resultadosContainer}>
        {/* TITULO SOLAMENTE */}
        <h1 className={styles.resultadosTitulo}>Resultados de Competidores</h1>

        {/* Leyenda */}
        <div className={styles.resultadosLeyenda}>
          <div className={styles.leyendaItem}><span className={`${styles.leyendaColor} ${styles.aprobado}`}></span> Aprobado</div>
          <div className={styles.leyendaItem}><span className={`${styles.leyendaColor} ${styles.reprobado}`}></span> Reprobado</div>
          <div className={styles.leyendaItem}><span className={`${styles.leyendaColor} ${styles.pendiente}`}></span> Pendiente</div>
        </div>

        {/* Contenedor con tabla (desktop) y lista móvil (mobile-first) */}
        <div className={styles.resultadosTablaContainer}>
          {competidores.length === 0 ? (
            <p style={{ color: "#666" }}>No hay competidores registrados para esta competencia.</p>
          ) : (
            <>
              {/* Desktop table (se oculta en mobile vía CSS) */}
              <table className={styles.resultadosTabla}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría / Peso</th>
                    <th colSpan={3}>Press Banca</th>
                    <th colSpan={3}>Peso Muerto</th>
                    <th colSpan={3}>Sentadilla</th>
                  </tr>
                  <tr className={styles.subHeader}>
                    {["PB R1", "PB R2", "PB R3", "PM R1", "PM R2", "PM R3", "S R1", "S R2", "S R3"].map((t, i) => <th key={i}>{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {competidores.map((c, i) => {
                    const per = resultsMap[c.id_competidor] || defaultPerExercise();
                    const rowStyle = i % 2 === 0 ? styles.filaPar : styles.filaImpar;
                    const combined: Repeticion[] = [...(per[1] || []), ...(per[2] || []), ...(per[3] || [])];
                    return (
                      <tr key={c.id_competidor} className={rowStyle}>
                        <td className={styles.cellName}>{nameOf(c)}</td>
                        <td className={styles.cellCategoria}>{c.categoria ?? formatPeso(c.peso)}</td>
                        {combined.map((rep, idx) => (
                          <td
                            key={idx}
                            className={styles.celdaResultado}
                            style={{ backgroundColor: getColor(rep.estado) }}
                            data-label={`R${idx + 1}`}
                          >
                            {rep.valor}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile cards (visible by default on mobile) */}
              <div className={styles.mobileList}>
                {competidores.map((c) => {
                  const per = resultsMap[c.id_competidor] || defaultPerExercise();
                  return (
                    <div key={c.id_competidor} className={styles.mobileCard}>
                      <div className={styles.mobileCardHeader}>
                        <div className={styles.mobileName}>{nameOf(c)}</div>
                        <div className={styles.mobileMeta}>{c.categoria ?? formatPeso(c.peso)}</div>
                      </div>

                      <div className={styles.mobileExercises}>
                        {[1, 2, 3].map((exId) => (
                          <div key={exId} className={styles.mobileExercise}>
                            <div className={styles.mobileExerciseTitle}>{EXERCISE_NAMES[exId]}</div>
                            <div className={styles.mobileReps}>
                              {(per[exId] || []).map((rep, rIdx) => (
                                <div key={rIdx} className={styles.mobileRep} style={{ borderLeft: `4px solid ${getColor(rep.estado)}` }}>
                                  <div className={styles.mobileRepLabel}>R{rIdx + 1}</div>
                                  <div className={styles.mobileRepValue}>{rep.valor}</div>
                                  <div className={styles.mobileRepState}>{rep.estado}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* removed the textual 'Cargando resultados...' — handled by the modal overlay */}
      </div>

      <BottomNavigationMenuCentral selected="resultados" />
    </div>
  );
};

export default ResultadosScreen;
