// src/pages/CalificarScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { FaFlag, FaFlagCheckered } from "react-icons/fa";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import styles from "../../styles/CalificarJuez.module.css";

/**
 * Ajusta según tu entorno:
 * - COMPETENCIA_ID: puede venir por props/route; aquí lo dejamos como constante para pruebas.
 * - ID_JUEZ: en producción debe venir del token/auth; aquí usamos localStorage como fallback.
 * - API_BASE / SOCKET_URL: apuntan a tu backend (por defecto http://localhost:3001).
 */
const COMPETENCIA_ID = Number(localStorage.getItem("competencia_id")) || 4;
const ID_JUEZ = Number(localStorage.getItem("id_juez")) || 2;
const API_BASE = "http://localhost:3001";
const SOCKET_URL = API_BASE;

/** Tipos locales */
type PesoAsignado = { id_ejercicio: number; intento: number; peso: string; estado_intento: string };
type OrdenResponseItem = { competidor: { id_competidor: number; nombre: string; orden: number }; pesos: PesoAsignado[] };

type IntentoLocal = {
  intento: number;
  peso?: string;
  estado_intento: string;
  resultadoFinal?: "Bueno" | "Malo" | null;
  tally?: { Bueno: number; Malo: number };
};

type EjercicioLocal = {
  id_ejercicio: number;
  nombre: string;
  intentos: IntentoLocal[]; // 3 elementos
};

type CompetidorLocal = {
  id_competidor: number;
  nombre: string;
  orden: number;
  ejercicios: EjercicioLocal[];
};

const EXERCISE_NAMES: Record<number, string> = {
  1: "Press Banca",
  2: "Sentadilla",
  3: "Peso Muerto",
};

const CalificarScreen: React.FC = () => {
  const [listaCompetidores, setListaCompetidores] = useState<CompetidorLocal[]>([]);
  const [activeCompetitorId, setActiveCompetitorId] = useState<number | null>(null);
  const [currentEjercicioIndex, setCurrentEjercicioIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [canCalificar, setCanCalificar] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // --- Helpers para mapear la respuesta del endpoint a la estructura local ---
  const mapCompetidores = (raw: OrdenResponseItem[]): CompetidorLocal[] => {
    // ordenar por competidor.orden asc
    const sorted = [...raw].sort((a, b) => (a.competidor.orden || 0) - (b.competidor.orden || 0));
    return sorted.map((item) => {
      // construir mapa de ejercicios -> intentos
      const ejerciciosMap: Record<number, IntentoLocal[]> = {};

      for (const p of item.pesos || []) {
        if (!ejerciciosMap[p.id_ejercicio]) {
          ejerciciosMap[p.id_ejercicio] = [
            { intento: 1, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
            { intento: 2, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
            { intento: 3, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
          ];
        }
        const arr = ejerciciosMap[p.id_ejercicio];
        if (p.intento >= 1 && p.intento <= 3) {
          arr[p.intento - 1].peso = p.peso;
          arr[p.intento - 1].estado_intento = p.estado_intento ?? arr[p.intento - 1].estado_intento;
        }
      }

      // asegurar ejercicios 1..3 existan
      const ejercicios: EjercicioLocal[] = [1, 2, 3].map((id) => {
        const intentos = ejerciciosMap[id] ?? [
          { intento: 1, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
          { intento: 2, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
          { intento: 3, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
        ];
        return { id_ejercicio: id, nombre: EXERCISE_NAMES[id] ?? `Ejercicio ${id}`, intentos };
      });

      return {
        id_competidor: item.competidor.id_competidor,
        nombre: item.competidor.nombre,
        orden: item.competidor.orden,
        ejercicios,
      };
    });
  };

  // --- Fetch inicial ---
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/orden/${COMPETENCIA_ID}/orden_pesos`);
        if (!res.ok) throw new Error("No se pudo obtener orden_pesos");
        const data: OrdenResponseItem[] = await res.json();
        if (!mounted) return;
        const mapped = mapCompetidores(data);
        setListaCompetidores(mapped);
      } catch (err) {
        console.error("error fetch orden_pesos:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // --- Polling fallback para detectar competidor activo (si el servidor NO emite sockets) ---
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orden/${COMPETENCIA_ID}/orden`);
        if (!res.ok) return;
        const rows = await res.json(); // rows de orden_participacion
        // buscar el que tenga estado 'en_curso'
        const active = (rows || []).find((r: any) => r.estado === "en_curso");
        if (active) {
          // actualizar activeCompetitorId si cambió
          setActiveCompetitorId(active.id_competidor);
          // Opcional: colocar ejercicio inicial en 0
          setCurrentEjercicioIndex(0);
          setIsRunning(true);
          // y refrescar lista de pesos por si cambiaron
          fetchOrdenPesos();
        } else {
          setIsRunning(false);
          // si el admin finalizó todo puede no haber en_curso
        }
      } catch (err) {
        // ignore
      }
    };
    // lanzar poll inmediatamente y luego cada 3s
    poll();
    pollRef.current = window.setInterval(poll, 3000) as unknown as number;
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaCompetidores]);

  // --- Socket.IO: conexión y listeners ---
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current.emit("join", { id_competencia: COMPETENCIA_ID });

    socketRef.current.on("order_update", () => {
      // re-fetch toda la lista de pesos para mantener single source of truth
      fetchOrdenPesos();
    });

    socketRef.current.on("start", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      setActiveCompetitorId(payload.id_competidor ?? null);
      if (payload?.id_ejercicio) {
        const idx = [1,2,3].indexOf(Number(payload.id_ejercicio));
        setCurrentEjercicioIndex(idx >= 0 ? idx : 0);
      } else {
        setCurrentEjercicioIndex(0);
      }
      setTimeLeft(payload?.remaining ?? 60);
      setIsRunning(true);
      setCanCalificar(true);
      // refresh pesos
      fetchOrdenPesos();
    });

    socketRef.current.on("pause", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      setIsRunning(false);
    });

    socketRef.current.on("resume", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      setIsRunning(true);
    });

    socketRef.current.on("next", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      // payload puede traer nextId o id_competidor
      const nextId = payload?.nextId ?? payload?.id_competidor;
      setActiveCompetitorId(nextId ?? null);
      setCurrentEjercicioIndex(0);
      setTimeLeft(payload?.remaining ?? 60);
      setIsRunning(true);
      setCanCalificar(true);
      fetchOrdenPesos();
    });

    socketRef.current.on("vote_update", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      applyVoteUpdateToState(payload);
    });

    return () => {
      socketRef.current?.emit("leave", { id_competencia: COMPETENCIA_ID });
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaCompetidores]);

  // --- Timer (cuando isRunning=true) ---
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // cuando expire, dejamos que admin haga 'next' o backend mande 'next'. Aquí solo reiniciamos timer.
          // Podríamos autopeticionar 'next' si esa es tu regla.
          setCanCalificar(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isRunning]);

  // --- Helpers de fetch ---
  const fetchOrdenPesos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orden/${COMPETENCIA_ID}/orden_pesos`);
      if (!res.ok) throw new Error("No se pudo obtener orden_pesos");
      const data: OrdenResponseItem[] = await res.json();
      const mapped = mapCompetidores(data);
      setListaCompetidores(mapped);
    } catch (err) {
      console.error("fetchOrdenPesos err:", err);
    }
  };

  // Aplicar payload de vote_update al estado local
  const applyVoteUpdateToState = (payload: any) => {
    const { id_competidor, id_ejercicio, intento, tally, resultadoFinal } = payload;
    setListaCompetidores((prev) => {
      const copy = prev.map((c) => ({
        ...c,
        ejercicios: c.ejercicios.map((e) => ({ ...e, intentos: e.intentos.map((it) => ({ ...it })) })),
      }));
      const comp = copy.find((c) => c.id_competidor === id_competidor);
      if (!comp) return prev;
      const ej = comp.ejercicios.find((x) => x.id_ejercicio === id_ejercicio);
      if (!ej) return prev;
      const it = ej.intentos.find((x) => x.intento === intento);
      if (!it) return prev;

      if (tally) it.tally = { Bueno: tally.Bueno ?? 0, Malo: tally.Malo ?? 0 };
      if (resultadoFinal) {
        it.resultadoFinal = resultadoFinal;
        it.estado_intento = resultadoFinal === "Bueno" ? "realizado" : "invalidado";
      }
      return copy;
    });
  };

  // Obtener intento objetivo (primer intentos programado/pendiente)
  const getTargetAttempt = (competidor: CompetidorLocal | undefined) => {
    if (!competidor) return null;
    const ejercicio = competidor.ejercicios[currentEjercicioIndex];
    if (!ejercicio) return null;
    const intentoObj = ejercicio.intentos.find((it) => it.estado_intento === "programado" || it.estado_intento === "pendiente") ?? ejercicio.intentos[0];
    return { id_ejercicio: ejercicio.id_ejercicio, intento: intentoObj.intento, peso: intentoObj.peso };
  };

  // POST de votación
  const calificar = async (tipo: "Bueno" | "Malo") => {
    if (!canCalificar || !isRunning) return;
    const comp = listaCompetidores.find((c) => c.id_competidor === activeCompetitorId);
    if (!comp) return;
    const target = getTargetAttempt(comp);
    if (!target) return;

    setCanCalificar(false);
    try {
      const resp = await fetch(`${API_BASE}/api/competencias/${COMPETENCIA_ID}/calificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_competidor: comp.id_competidor,
          id_ejercicio: target.id_ejercicio,
          intento: target.intento,
          id_juez: ID_JUEZ,
          valor: tipo,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("error calificar:", data);
        setCanCalificar(true);
        return;
      }
      // Optimistic: aumentar un conteo local (no cambia resultadoFinal)
      setListaCompetidores((prev) => {
        const copy = prev.map((c) => ({
          ...c,
          ejercicios: c.ejercicios.map((e) => ({ ...e, intentos: e.intentos.map(i => ({ ...i })) })),
        }));
        const c = copy.find((x) => x.id_competidor === comp.id_competidor);
        if (!c) return prev;
        const ej = c.ejercicios[currentEjercicioIndex];
        const it = ej.intentos.find((i) => i.intento === target.intento);
        if (!it) return prev;
        it.tally = { ...(it.tally || { Bueno: 0, Malo: 0 }) };
        it.tally[tipo] = (it.tally[tipo] || 0) + 1;
        return copy;
      });
      // server enviará vote_update con tally definitivo
    } catch (err) {
      console.error("calificar error:", err);
      setCanCalificar(true);
    }
  };

  // UI
  const activeCompetitor = listaCompetidores.find((c) => c.id_competidor === activeCompetitorId) ?? null;

  return (
    <div className={styles.calificarScreen}>
      <div className={styles.calificarContainer}>
        <h1 className={styles.calificarTitulo}>Calificación de Competidores</h1>

        {loading ? (
          <p>Cargando...</p>
        ) : !activeCompetitor ? (
          <div className={styles.esperandoAdmin}>
            <p>Esperando señal del administrador para comenzar la calificación...</p>
            <button onClick={fetchOrdenPesos}>Actualizar lista</button>
          </div>
        ) : (
          <>
            <h2 className={styles.calificarSubtitulo}>
              Competidor #{activeCompetitor.orden} — {activeCompetitor.nombre}
            </h2>

            <div className={styles.calificarTiempo}>
              <p>Tiempo restante</p>
              <span>{timeLeft}s</span>
              <div><small>{isRunning ? "En curso" : "Pausado"}</small></div>
            </div>

            <div className={styles.calificarListaEjercicios}>
              {activeCompetitor.ejercicios.map((ej, idx) => (
                <div key={ej.id_ejercicio} className={`${styles.calificarEjercicio} ${idx === currentEjercicioIndex ? styles.activo : ""}`}>
                  <h3>{ej.nombre}</h3>
                  <div className={styles.calificarIntentos}>
                    {ej.intentos.map((it) => (
                      <div
                        key={it.intento}
                        title={`Intento ${it.intento} • Peso: ${it.peso ?? "-"} • Estado: ${it.estado_intento}`}
                        className={`${styles.intentoCircle} ${
                          it.resultadoFinal === "Bueno"
                            ? styles.bueno
                            : it.resultadoFinal === "Malo"
                            ? styles.malo
                            : it.estado_intento === "realizado"
                            ? styles.bueno
                            : it.estado_intento === "invalidado"
                            ? styles.malo
                            : styles.pendiente
                        }`}
                      >
                        <div className={styles.intentoInfo}>
                          <small>{it.intento}</small>
                          <small>{it.tally ? `${it.tally.Bueno}/${(it.tally.Bueno + it.tally.Malo) || 0}` : ""}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  {idx === currentEjercicioIndex && <p className={styles.textoActivo}>Ejercicio activo para calificación</p>}
                </div>
              ))}
            </div>

            <div className={styles.calificarBotones}>
              <button className={`${styles.btnCalificar} ${styles.malo}`} onClick={() => calificar("Malo")} disabled={!canCalificar || !isRunning}>
                <FaFlag color="white" size={22} /> <span>Malo</span>
              </button>
              <button className={`${styles.btnCalificar} ${styles.bueno}`} onClick={() => calificar("Bueno")} disabled={!canCalificar || !isRunning}>
                <FaFlagCheckered color="white" size={22} /> <span>Bueno</span>
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNavigationMenuCentral selected="calificar" />
    </div>
  );
};

export default CalificarScreen;
