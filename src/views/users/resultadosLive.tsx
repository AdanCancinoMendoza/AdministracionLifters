import React, { useEffect, useMemo, useState, useRef } from "react";
import styles from '../../styles/UsersLiveResults.module.css';
import Footer from "../../components/users/footer";
import { io, Socket } from "socket.io-client";
import LoadingModalJuez from "../jueces/LoadingModalJuez";

type Competencia = {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto?: string | null;
  fecha_evento?: string | null;
  ubicacion?: string | null;
};

type AttemptApi = {
  id: number;
  id_competencia: number;
  id_competidor: number;
  exercise_id: number;
  attempt_number: number;
  weight_kg?: string | null;
  approved?: number | null;
  [k: string]: any;
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

type LiveStream = {
  id_live: number;
  id_competencia: number;
  youtube_url: string;
  title?: string | null;
  active: number;
  start_datetime?: string | null;
};

const BASE = "http://localhost:3001";
const COMPETICIONES_API = `${BASE}/api/competenciasadmin`;
const LIVE_STREAMS_ACTIVE_API = `${BASE}/api/lives/active`;
const LIVE_STREAMS_API = `${BASE}/api/lives`;
const COMPETITORS_API = `${BASE}/api/competidor`;
const ATTEMPTS_BY_COMPETITOR = `${BASE}/api/attempts/by-competitor`;
const SOCKET_URL = BASE;

const EX_NAME: Record<number, string> = { 1: "Press Banca", 2: "Peso Muerto", 3: "Sentadilla" };

type Repeticion = { valor: string; estado: "APROBADO" | "REPROBADO" | "PENDIENTE"; attemptId?: number | null };

const defaultPerExercise = (): Record<number, Repeticion[]> => ({
  1: [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }],
  2: [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }],
  3: [{ valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }, { valor: "—", estado: "PENDIENTE", attemptId: null }],
});

const approvedToEstado = (approved: number | boolean | null) =>
  (approved === 1 || approved === true) ? "APROBADO" : (approved === 0 || approved === false) ? "REPROBADO" : "PENDIENTE";

function isSameDayISO(isoDate?: string | null) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    const parts = u.pathname.split("/").filter(Boolean);
    const liveIdx = parts.indexOf("live");
    if (liveIdx >= 0 && parts[liveIdx + 1]) {
      return `https://www.youtube.com/embed/${parts[liveIdx + 1]}`;
    }
    if (url.includes("/embed/")) return url;
  } catch (e) { /* ignore */ }
  return url;
}

export default function LiveResultsSection(): JSX.Element {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeStreams, setActiveStreams] = useState<Record<number, LiveStream>>({});
  const [competitorsByComp, setCompetitorsByComp] = useState<Record<number, Competidor[]>>({});
  const [resultsByComp, setResultsByComp] = useState<Record<number, Record<number, Record<number, Repeticion[]>>>>({});

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(COMPETICIONES_API)
      .then(r => r.json())
      .then((data: Competencia[]) => {
        if (!mounted) return;
        const normalized = (Array.isArray(data) ? data : []).map((c: any) => ({
          ...c,
          foto: c.foto ? `${BASE}${c.foto}` : null
        }));
        setCompetencias(normalized);
      })
      .catch(err => {
        console.error("Error cargando competencias:", err);
        setCompetencias([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        let res = await fetch(LIVE_STREAMS_ACTIVE_API);
        if (!res.ok) {
          res = await fetch(LIVE_STREAMS_API);
          if (!res.ok) throw new Error("No se pudo obtener live streams");
          const all = await res.json();
          const actives = (Array.isArray(all) ? all : []).filter((s: any) => Number(s.active) === 1);
          if (!mounted) return;
          const map: Record<number, LiveStream> = {};
          actives.forEach((s: LiveStream) => (map[s.id_competencia] = s));
          setActiveStreams(map);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        const map: Record<number, LiveStream> = {};
        (Array.isArray(data) ? data : []).forEach((s: LiveStream) => (map[s.id_competencia] = s));
        setActiveStreams(map);
      } catch (err) {
        console.error("Error cargando live streams:", err);
        if (!mounted) return;
        setActiveStreams({});
      }
    };

    load();
    const timer = setInterval(load, 20_000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  const liveCompetitions = useMemo(() => {
    const activeIds = Object.keys(activeStreams).map(k => Number(k));
    if (activeIds.length > 0) {
      return competencias.filter(c => activeIds.includes(c.id_competencia));
    }
    return competencias.filter(c => isSameDayISO(c.fecha_evento));
  }, [competencias, activeStreams]);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    const loadForCompetitions = async () => {
      try {
        const comps = liveCompetitions;
        const newCompetitorsByComp: Record<number, Competidor[]> = {};
        const newResultsByComp: Record<number, Record<number, Record<number, Repeticion[]>>> = {};

        await Promise.all(comps.map(async (comp) => {
          try {
            const r = await fetch(COMPETITORS_API, { signal: ac.signal });
            if (!r.ok) {
              newCompetitorsByComp[comp.id_competencia] = [];
              newResultsByComp[comp.id_competencia] = {};
              return;
            }
            const arr: Competidor[] = await r.json();
            const filtered = (Array.isArray(arr) ? arr : []).filter(c => Number(c.id_competencia) === Number(comp.id_competencia));
            newCompetitorsByComp[comp.id_competencia] = filtered;

            const perCompResults: Record<number, Record<number, Repeticion[]>> = {};
            await Promise.all(filtered.map(async (compItem) => {
              const perExercise = defaultPerExercise();
              try {
                const url = `${ATTEMPTS_BY_COMPETITOR}?id_competencia=${comp.id_competencia}&id_competidor=${compItem.id_competidor}`;
                const rr = await fetch(url, { signal: ac.signal });
                if (!rr.ok) {
                  perCompResults[compItem.id_competidor] = perExercise;
                  return;
                }
                const attempts: AttemptApi[] = await rr.json();
                for (const a of attempts) {
                  const ex = Number(a.exercise_id);
                  const slotIdx = Math.max(0, Math.min(2, Number(a.attempt_number) - 1));
                  const valor = a.weight_kg ? `${parseFloat(String(a.weight_kg)).toFixed(0)} kg` : "—";
                  const estado = approvedToEstado(a.approved as any);
                  perExercise[ex] = perExercise[ex] || defaultPerExercise()[ex];
                  perExercise[ex][slotIdx] = { valor, estado, attemptId: a.id ?? null };
                }
              } catch (err) {
              } finally {
                perCompResults[compItem.id_competidor] = perExercise;
              }
            }));
            newResultsByComp[comp.id_competencia] = perCompResults;
          } catch (err) {
            newCompetitorsByComp[comp.id_competencia] = [];
            newResultsByComp[comp.id_competencia] = {};
          }
        }));

        if (!mounted) return;
        setCompetitorsByComp(newCompetitorsByComp);
        setResultsByComp(newResultsByComp);
      } catch (err) {
        console.error("Error cargando intentos por competencia:", err);
      }
    };

    void loadForCompetitions();

    return () => { mounted = false; ac.abort(); };
  }, [liveCompetitions]);

  useEffect(() => {
    if (liveCompetitions.length === 0) return;
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => {
      try {
        for (const c of liveCompetitions) {
          s.emit("join", { id_competencia: c.id_competencia });
        }
      } catch { }
    });

    const handleAttempt = (payload: any) => {
      if (!payload) return;
      const att: AttemptApi = payload.attempt ?? payload;
      if (!att) return;
      const compId = Number(att.id_competencia);
      if (!liveCompetitions.some(c => Number(c.id_competencia) === compId)) return;

      setResultsByComp(prev => {
        const copy = { ...prev };
        const compMap = copy[compId] ? { ...copy[compId] } : {};
        const compIdNum = Number(att.id_competidor);
        const perExercise = compMap[compIdNum] ? { ...compMap[compIdNum] } : defaultPerExercise();
        const ex = Number(att.exercise_id);
        const slotIdx = Math.max(0, Math.min(2, Number(att.attempt_number) - 1));
        const valor = att.weight_kg ? `${parseFloat(String(att.weight_kg)).toFixed(0)} kg` : "—";
        const estado = approvedToEstado(att.approved as any);
        perExercise[ex] = perExercise[ex] ? [...perExercise[ex]] : defaultPerExercise()[ex];
        perExercise[ex][slotIdx] = { valor, estado, attemptId: att.id ?? null };
        compMap[compIdNum] = perExercise;
        copy[compId] = compMap;
        return copy;
      });
    };

    s.on("attempt_update", handleAttempt);
    s.on("vote_update", handleAttempt);
    s.on("competitor:selected", () => {
      (async () => {
        try {
          const updatedResults: Record<number, Record<number, Record<number, Repeticion[]>>> = { ...resultsByComp };
          for (const comp of liveCompetitions) {
            const comps = competitorsByComp[comp.id_competencia] ?? [];
            for (const compItem of comps) {
              try {
                const url = `${ATTEMPTS_BY_COMPETITOR}?id_competencia=${comp.id_competencia}&id_competidor=${compItem.id_competidor}`;
                const r = await fetch(url);
                if (!r.ok) continue;
                const arr: AttemptApi[] = await r.json();
                const perExercise = defaultPerExercise();
                for (const a of arr) {
                  const ex = Number(a.exercise_id);
                  const slotIdx = Math.max(0, Math.min(2, Number(a.attempt_number) - 1));
                  const valor = a.weight_kg ? `${parseFloat(String(a.weight_kg)).toFixed(0)} kg` : "—";
                  const estado = approvedToEstado(a.approved as any);
                  perExercise[ex] = perExercise[ex] || defaultPerExercise()[ex];
                  perExercise[ex][slotIdx] = { valor, estado, attemptId: a.id ?? null };
                }
                updatedResults[comp.id_competencia] = { ...(updatedResults[comp.id_competencia] || {}), [compItem.id_competidor]: perExercise };
              } catch { }
            }
          }
          setResultsByComp(updatedResults);
        } catch (e) { /* ignore */ }
      })();
    });

    return () => {
      try {
        for (const c of liveCompetitions) s.emit("leave", { id_competencia: c.id_competencia });
      } catch { }
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCompetitions, competitorsByComp]);

  const getColor = (estado: Repeticion["estado"]) => {
    switch (estado) {
      case "APROBADO": return "#4CAF50";
      case "REPROBADO": return "#F44336";
      case "PENDIENTE": return "#03A9F4";
      default: return "#BDBDBD";
    }
  };

  const formatPeso = (p?: string | null) => (p == null || p === "" ? "—" : `${Number(p).toFixed(2)} kg`);
  const nameOf = (c?: Competidor | null) => (!c ? "—" : `${c!.nombre}${c!.apellidos ? " " + c!.apellidos : ""}`);

  if (loading) {
    // mostramos modal de carga mientras carga inicial
    return (
      <section className={styles.container}>
        <LoadingModalJuez open={true} message="Cargando resultados..." variant="spinner" size="md" backdropClose={false} />
      </section>
    );
  }

  if (liveCompetitions.length === 0) {
    return (
      <section className={styles.container}>
        <div className={styles.emptyCard}>
          <div className={styles.emptyLeft}>
            <h2>No hay competencias en vivo</h2>
            <p>Por ahora no se está transmitiendo ninguna competencia. Regresa más tarde o revisa la sección de próximas competencias.</p>
            <div className={styles.emptyActions}>
              <button className={styles.primary}>Ver próximas competencias</button>
              <button className={styles.ghost}>Suscribirme a notificaciones</button>
            </div>
          </div>
          <div className={styles.emptyRight}>
            <svg width="260" height="160" viewBox="0 0 260 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="260" height="160" rx="12" fill="#f4f7fb" />
              <g transform="translate(30,28)">
                <rect width="160" height="90" rx="8" fill="#e9f2ff" />
                <rect x="8" y="8" width="40" height="20" rx="4" fill="#d6e9ff" />
                <rect x="56" y="8" width="96" height="10" rx="5" fill="#dbeeff" />
                <rect x="8" y="36" width="144" height="8" rx="4" fill="#eaf4ff" />
                <rect x="8" y="52" width="70" height="8" rx="4" fill="#eaf4ff" />
              </g>
            </svg>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      {liveCompetitions.map((comp) => {
        const competitors = competitorsByComp[comp.id_competencia] ?? [];
        const resultsMap = resultsByComp[comp.id_competencia] ?? {};
        const stream = activeStreams[comp.id_competencia];

        return (
          <article key={comp.id_competencia} className={styles.liveCard}>
            <header className={styles.liveHeader}>
              <div className={styles.headerLeft}>
                {stream ? <span className={styles.statusBadge}>EN VIVO</span> : <span className={styles.statusBadgeGray}>EN ESPERA</span>}
                <h3 className={styles.eventTitle}>{comp.nombre}{stream && stream.title ? ` — ${stream.title}` : ''}</h3>
              </div>

              <div className={styles.headerMedia}>
                <div className={styles.mediaLeft}>
                  <img src={comp.foto ?? "https://via.placeholder.com/640x360?text=Evento"} alt={comp.nombre} className={styles.eventImage} />
                  {!stream && <div className={styles.mediaOverlayText}>Próximo</div>}
                </div>

                {stream && (
                  <div className={styles.mediaRight}>
                    <div className={styles.videoWrap}>
                      <iframe
                        title={`live-${comp.id_competencia}`}
                        src={toYouTubeEmbed(stream.youtube_url)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.embedIframe}
                      />
                    </div>
                    <div className={styles.liveBadge}>EN DIRECTO</div>
                  </div>
                )}
              </div>
            </header>

            <div className={styles.sectionBody}>
              <h4 className={styles.tableTitle}>Competidores</h4>

              <div className={styles.tableWrapper}>
                <table className={styles.resultsTable}>
                  <thead>
                    <tr>
                      <th>Núm</th>
                      <th>Competidor</th>
                      <th>Peso</th>
                      <th className={styles.groupHeader} colSpan={3}>{EX_NAME[1]}</th>
                      <th className={styles.groupHeader} colSpan={3}>{EX_NAME[2]}</th>
                      <th className={styles.groupHeader} colSpan={3}>{EX_NAME[3]}</th>
                    </tr>
                    <tr>
                      <th colSpan={3}></th>
                      <th>1</th><th>2</th><th>3</th>
                      <th>1</th><th>2</th><th>3</th>
                      <th>1</th><th>2</th><th>3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.length === 0 ? (
                      <tr><td colSpan={12} style={{ textAlign: "center", padding: 16, color: "#666" }}>No hay competidores registrados</td></tr>
                    ) : competitors.map((c, i) => {
                      const per = resultsMap[c.id_competidor] ?? defaultPerExercise();
                      return (
                        <tr key={c.id_competidor}>
                          <td>{i + 1}</td>
                          <td className={styles.nameCell}>{nameOf(c)}</td>
                          <td>{c.categoria ?? formatPeso(c.peso)}</td>

                          {(per[1] || []).map((r, idx) => (
                            <td key={`c${c.id_competidor}-1-${idx}`}><span style={{ background: getColor(r.estado), color: "#fff", padding: "6px 8px", borderRadius: 6, fontWeight: 700 }}>{r.valor}</span></td>
                          ))}

                          {(per[2] || []).map((r, idx) => (
                            <td key={`c${c.id_competidor}-2-${idx}`}><span style={{ background: getColor(r.estado), color: "#fff", padding: "6px 8px", borderRadius: 6, fontWeight: 700 }}>{r.valor}</span></td>
                          ))}

                          {(per[3] || []).map((r, idx) => (
                            <td key={`c${c.id_competidor}-3-${idx}`}><span style={{ background: getColor(r.estado), color: "#fff", padding: "6px 8px", borderRadius: 6, fontWeight: 700 }}>{r.valor}</span></td>
                          ))}

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botones removidos por petición (ver/descargar) */}

            </div>
          </article>
        );
      })}

      <Footer />
    </section>
  );
}
