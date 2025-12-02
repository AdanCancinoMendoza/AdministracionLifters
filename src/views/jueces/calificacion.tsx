// src/views/jueces/calificacion.tsx
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import styles from "../../styles/CalificarJuez.module.css";

interface Juez { id_juez: number; id_competencia: number; nombre?: string; apellidos?: string; usuario?: string; }
type PesoAsignado = { id?: number; id_ejercicio: number; intento: number; peso?: any; estado_intento?: string; approved?: number | null; notes?: string | null };
type OrdenResponseItem = { competidor: { id_competidor: number; nombre: string; orden: number;[k: string]: any }; pesos: PesoAsignado[]; };

type IntentoLocal = { intento: number; peso?: string | undefined; estado_intento: string; resultadoFinal?: "Bueno" | "Malo" | null; tally?: { Bueno: number; Malo: number }; attemptId?: number | null; votedByMe?: boolean };
type EjercicioLocal = { id_ejercicio: number; nombre: string; intentos: IntentoLocal[]; };
type CompetidorLocal = { id_competidor: number; nombre: string; orden: number; ejercicios: EjercicioLocal[]; };

type CompetidorApi = {
  id_competidor: number;
  nombre: string;
  apellidos?: string;
  peso?: string | null;
  id_competencia?: number;
  [k: string]: any;
};

const API_BASE = "http://localhost:3001";
const SOCKET_URL = API_BASE;
const ATTEMPTS_API = `${API_BASE}/api/attempts`;
const MODULES_API = `${API_BASE}/api/modules`;
const COMPETITOR_API = `${API_BASE}/api/competidor`;
const EXERCISE_NAMES: Record<number, string> = { 1: "Press Banca", 2: "Peso Muerto", 3: "Sentadilla" };

const CalificarScreen: React.FC<{ userJuez: Juez | null }> = ({ userJuez }) => {
  const navigate = useNavigate();

  const [juez, setJuez] = useState<Juez | null>(userJuez);
  const [competenciaId, setCompetenciaId] = useState<number | null>(userJuez?.id_competencia ?? null);
  const [competitionName, setCompetitionName] = useState<string | null>(null);

  const [listaCompetidores, setListaCompetidores] = useState<CompetidorLocal[]>([]);
  const [activeCompetitorId, setActiveCompetitorId] = useState<number | null>(null);
  const [currentEjercicioIndex, setCurrentEjercicioIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeCompetitorDetail, setActiveCompetitorDetail] = useState<CompetidorApi | null>(null);

  // evita dobles envíos: keyed por attemptId (si existe)
  const [pendingSubmits, setPendingSubmits] = useState<Record<number, boolean>>({});

  // almacenamiento local para saber si este juez ya votó un intento (keyed por attemptId o comp-ex-attempt)
  const [votedAttempts, setVotedAttempts] = useState<Record<string, boolean>>({});

  // clave del intento "congelado" después de votar; evita que la UI salte al siguiente intento automáticamente
  const [frozenAttemptKey, setFrozenAttemptKey] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userJuez) {
      navigate("/jueces/login");
      return;
    }
    setJuez(userJuez);
    setCompetenciaId(userJuez.id_competencia ?? null);
  }, [userJuez, navigate]);

  const parseNotesTally = (notesRaw: any) => {
    const tally = { Bueno: 0, Malo: 0 };
    if (!notesRaw) return tally;
    try {
      const arr = typeof notesRaw === "string" ? JSON.parse(notesRaw) : notesRaw;
      if (Array.isArray(arr)) {
        for (const n of arr) {
          if (n?.valor === "Bueno") tally.Bueno++;
          if (n?.valor === "Malo") tally.Malo++;
        }
      }
    } catch {
      // ignore
    }
    return tally;
  };

  // intenta detectar si en notes hay referencia a un voto del juez actual
  const didJudgeVote = (notesRaw: any, judgeIdToCheck: number | null) => {
    if (!notesRaw || !judgeIdToCheck) return false;
    try {
      const arr = typeof notesRaw === "string" ? JSON.parse(notesRaw) : notesRaw;
      if (!Array.isArray(arr)) return false;
      for (const n of arr) {
        if (n?.judge_id === judgeIdToCheck || n?.juez_id === judgeIdToCheck || n?.judgeId === judgeIdToCheck || n?.author_id === judgeIdToCheck || n?.user_id === judgeIdToCheck) {
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  };

  const getAttemptKey = (attemptId: number | null | undefined, id_competidor?: number, exercise_id?: number, attempt_number?: number) => {
    if (attemptId) return `id:${attemptId}`;
    if (id_competidor != null && exercise_id != null && attempt_number != null) return `${id_competidor}-${exercise_id}-${attempt_number}`;
    return `unknown`;
  };

  const mapCompetidores = (raw: OrdenResponseItem[]): CompetidorLocal[] => {
    const sorted = [...raw].sort((a, b) => (a.competidor.orden ?? 0) - (b.competidor.orden ?? 0));
    return sorted.map((item) => {
      const ejerciciosMap: Record<number, IntentoLocal[]> = {};
      for (const p of item.pesos || []) {
        if (!ejerciciosMap[p.id_ejercicio]) {
          ejerciciosMap[p.id_ejercicio] = [
            { intento: 1, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
            { intento: 2, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
            { intento: 3, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
          ];
        }
        const arr = ejerciciosMap[p.id_ejercicio];
        if (p.intento >= 1 && p.intento <= 3) {
          const idx = p.intento - 1;
          arr[idx].peso = p.peso;
          arr[idx].attemptId = (p as any).id ?? arr[idx].attemptId ?? null;
          arr[idx].estado_intento = p.estado_intento ?? arr[idx].estado_intento;
          if ((p as any).approved !== undefined && (p as any).approved !== null) {
            arr[idx].resultadoFinal = (p as any).approved ? "Bueno" : "Malo";
          }
          if ((p as any).notes) {
            arr[idx].tally = parseNotesTally((p as any).notes);
            arr[idx].votedByMe = didJudgeVote((p as any).notes, getJudgeId());
            if (arr[idx].votedByMe) {
              const key = getAttemptKey(arr[idx].attemptId, item.competidor.id_competidor, p.id_ejercicio, p.intento);
              setVotedAttempts(prev => ({ ...prev, [key]: true }));
            }
          }
        }
      }
      const ejercicios: EjercicioLocal[] = [1, 2, 3].map((id) => {
        const intentos = ejerciciosMap[id] ?? [
          { intento: 1, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
          { intento: 2, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
          { intento: 3, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
        ];
        return { id_ejercicio: id, nombre: EXERCISE_NAMES[id] ?? `Ejercicio ${id}`, intentos };
      });

      return {
        id_competidor: item.competidor.id_competidor,
        nombre: item.competidor.nombre,
        orden: item.competidor.orden ?? 0,
        ejercicios,
      };
    });
  };

  const fetchCompetitionName = async (compId: number) => {
    try {
      const r = await fetch(`${API_BASE}/api/competencias/${compId}`);
      if (!r.ok) return setCompetitionName(null);
      const j = await r.json();
      const name = j?.nombre ?? j?.name ?? j?.title ?? null;
      setCompetitionName(name);
    } catch {
      setCompetitionName(null);
    }
  };

  const fetchOrdenPesos = async (): Promise<CompetidorLocal[] | void> => {
    if (!competenciaId) return;
    try {
      const mRes = await fetch(`${MODULES_API}?competition_id=${competenciaId}`);
      if (!mRes.ok) throw new Error("No se pudo obtener módulos");
      const modules = await mRes.json();

      const assignPromises = modules.map(async (m: any) => {
        try {
          const r = await fetch(`${MODULES_API}/${m.id}/assignments`);
          if (!r.ok) return { module: m, assigns: [] };
          const assigns = await r.json();
          return { module: m, assigns };
        } catch {
          return { module: m, assigns: [] };
        }
      });
      const moduleAssigns = await Promise.all(assignPromises);

      const ordenArray: { id_competidor: number; nombre: string; orden: number }[] = [];
      for (const ma of moduleAssigns) {
        const assigns = ma.assigns || [];
        for (const a of assigns) {
          const existing = ordenArray.find((x) => x.id_competidor === Number(a.id_competidor));
          if (!existing) {
            ordenArray.push({
              id_competidor: Number(a.id_competidor),
              nombre: `${a.nombre ?? ""}${a.apellidos ? " " + a.apellidos : ""}`.trim() || (a.nombre ?? "Competidor"),
              orden: a.position != null ? Number(a.position) : ordenArray.length + 1,
            });
          }
        }
      }

      if (ordenArray.length === 0) {
        setListaCompetidores([]);
        return [];
      }

      const itemsPromises = ordenArray.map(async (c) => {
        try {
          const r = await fetch(`${ATTEMPTS_API}/by-competitor?id_competencia=${competenciaId}&id_competidor=${c.id_competidor}`);
          const rows = r.ok ? await r.json() : [];
          const pesos: PesoAsignado[] = (rows || []).map((row: any) => ({
            id: row.id,
            id_ejercicio: Number(row.exercise_id),
            intento: Number(row.attempt_number),
            peso: row.weight_kg,
            estado_intento: row.approved == null ? "pendiente" : row.approved ? "realizado" : "invalidado",
            approved: row.approved,
            notes: row.notes ?? null,
          }));
          return { competidor: { id_competidor: c.id_competidor, nombre: c.nombre, orden: c.orden }, pesos };
        } catch (err) {
          return { competidor: { id_competidor: c.id_competidor, nombre: c.nombre, orden: c.orden }, pesos: [] };
        }
      });

      const responseItems: OrdenResponseItem[] = await Promise.all(itemsPromises);
      const mapped = mapCompetidores(responseItems);
      setListaCompetidores(mapped);
      return mapped;
    } catch (err) {
      console.error("fetchOrdenPesos err:", err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!competenciaId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const mapped = await fetchOrdenPesos();
        await fetchCompetitionName(competenciaId);
        if (mounted && mapped && mapped.length > 0) {
          // nothing specific now
        }
      } catch (err) {
        console.error("init error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competenciaId]);

  const fetchCompetitorDetailAndAttempts = async (id_competidor: number) => {
    try {
      let detail: CompetidorApi | null = null;
      try {
        const r = await fetch(`${COMPETITOR_API}/${id_competidor}`);
        if (r.ok) detail = await r.json();
      } catch {
        try {
          const r2 = await fetch(COMPETITOR_API);
          if (r2.ok) {
            const arr = await r2.json();
            detail = arr.find((x: any) => Number(x.id_competidor) === Number(id_competidor)) ?? null;
          }
        } catch { }
      }

      if (!detail) {
        const fallback = listaCompetidores.find((c) => c.id_competidor === id_competidor);
        if (fallback) {
          detail = { id_competidor: fallback.id_competidor, nombre: fallback.nombre, peso: (fallback as any).peso ?? null } as CompetidorApi;
        }
      }

      setActiveCompetitorDetail(detail);
    } catch (err) {
      console.warn("fetch competitor detail failed", err);
      setActiveCompetitorDetail(null);
    }

    try {
      if (!competenciaId) return;
      const r = await fetch(`${ATTEMPTS_API}/by-competitor?id_competencia=${competenciaId}&id_competidor=${id_competidor}`);
      if (!r.ok) return;
      const rows = await r.json();

      setListaCompetidores((prev) => {
        const copy = prev.map((c) => ({ ...c, ejercicios: c.ejercicios.map((e) => ({ ...e, intentos: e.intentos.map(it => ({ ...it })) })) }));
        const comp = copy.find((c) => c.id_competidor === id_competidor);
        if (!comp) return prev;
        comp.ejercicios.forEach((ej) => {
          ej.intentos = [
            { intento: 1, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
            { intento: 2, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
            { intento: 3, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 }, attemptId: null, votedByMe: false },
          ];
        });
        for (const row of rows) {
          const exIdx = comp.ejercicios.findIndex(e => e.id_ejercicio === Number(row.exercise_id));
          if (exIdx >= 0) {
            const slot = Number(row.attempt_number) - 1;
            if (slot >= 0 && slot < 3) {
              comp.ejercicios[exIdx].intentos[slot].peso = row.weight_kg;
              comp.ejercicios[exIdx].intentos[slot].estado_intento = row.approved == null ? "pendiente" : row.approved ? "realizado" : "invalidado";
              comp.ejercicios[exIdx].intentos[slot].resultadoFinal = row.approved == null ? null : row.approved ? "Bueno" : "Malo";
              comp.ejercicios[exIdx].intentos[slot].attemptId = row.id ?? null;
              comp.ejercicios[exIdx].intentos[slot].tally = parseNotesTally(row.notes);
              comp.ejercicios[exIdx].intentos[slot].votedByMe = didJudgeVote(row.notes, getJudgeId());
              if (comp.ejercicios[exIdx].intentos[slot].votedByMe) {
                const key = getAttemptKey(row.id ?? null, id_competidor, Number(row.exercise_id), Number(row.attempt_number));
                setVotedAttempts(prev => ({ ...prev, [key]: true }));
              }
            }
          }
        }
        return copy;
      });

      if (Array.isArray(rows) && rows.length > 0) {
        const maybeBody = rows.find((r: any) => r.body_weight || r.peso_corporal || r.peso || r.bodyWeight);
        if (maybeBody) {
          setActiveCompetitorDetail((prev) => {
            if (prev && (prev.peso != null && prev.peso !== "")) return prev;
            return { ...(prev ?? {}), peso: maybeBody.body_weight ?? maybeBody.peso_corporal ?? maybeBody.peso ?? maybeBody.bodyWeight ?? null } as CompetidorApi;
          });
        }
      }

    } catch (err) {
      console.warn("fetch attempts by competitor failed", err);
    }
  };

  useEffect(() => {
    if (!competenciaId) return;

    const s = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = s;
    s.on("connect", () => {
      try { s.emit("join", { id_competencia: competenciaId }); } catch { }
    });

    // actualiza UI con eventos de voto
    s.on("vote_update", (payload: any) => {
      if (!payload) return;
      if (payload.id_competencia && payload.id_competencia !== competenciaId) return;
      if (payload.attempt) {
        const att = payload.attempt;
        setListaCompetidores(prev => {
          const copy = prev.map(c => ({ ...c, ejercicios: c.ejercicios.map(e => ({ ...e, intentos: e.intentos.map(it => ({ ...it })) })) }));
          for (const comp of copy) {
            for (const ej of comp.ejercicios) {
              for (let i = 0; i < ej.intentos.length; i++) {
                if (ej.intentos[i].attemptId === att.id) {
                  ej.intentos[i].estado_intento = att.approved == null ? "pendiente" : att.approved ? "realizado" : "invalidado";
                  ej.intentos[i].resultadoFinal = att.approved == null ? null : att.approved ? "Bueno" : "Malo";
                  ej.intentos[i].tally = parseNotesTally(att.notes);
                  ej.intentos[i].votedByMe = didJudgeVote(att.notes, getJudgeId());
                  if (ej.intentos[i].votedByMe) {
                    const key = getAttemptKey(att.id, undefined, undefined, undefined);
                    setVotedAttempts(prev => ({ ...prev, [key]: true }));
                  }
                }
              }
            }
          }
          return copy;
        });
      }
    });

    s.on("start", async (payload: any) => {
      if (payload?.id_competencia !== competenciaId) return;
      // cuando admin manda start, limpiamos freeze para permitir nueva selección desde admin
      setFrozenAttemptKey(null);

      if (payload?.id_competidor != null) setActiveCompetitorId(Number(payload.id_competidor));
      if (payload?.id_ejercicio) {
        const idx = [1, 2, 3].indexOf(Number(payload.id_ejercicio));
        setCurrentEjercicioIndex(idx >= 0 ? idx : 0);
      } else setCurrentEjercicioIndex(0);

      if (typeof payload?.remaining === "number") {
        setTimeLeft(Number(payload.remaining));
        setIsRunning(Number(payload.remaining) > 0);
      } else if (payload?.running !== undefined) {
        setIsRunning(Boolean(payload.running));
      } else {
        setIsRunning(true);
      }
      await fetchOrdenPesos();
    });

    s.on("competitor:selected", async (payload: any) => {
      if (payload?.id_competencia !== competenciaId) return;
      // limpiar freeze si admin selecciona otro competidor/ejercicio
      setFrozenAttemptKey(null);

      const compId = payload?.id_competidor ?? null;
      if (compId != null) {
        setActiveCompetitorId(Number(compId));
        if (payload?.id_ejercicio) {
          const idx = [1, 2, 3].indexOf(Number(payload.id_ejercicio));
          setCurrentEjercicioIndex(idx >= 0 ? idx : 0);
        } else setCurrentEjercicioIndex(0);
        if (typeof payload?.remaining === "number") {
          setTimeLeft(Number(payload.remaining));
          setIsRunning(Number(payload.remaining) > 0);
        } else if (payload?.running !== undefined) {
          setIsRunning(Boolean(payload.running));
        }
        await fetchOrdenPesos();
      }
    });

    s.on("pause", (payload: any) => {
      if (payload?.id_competencia !== competenciaId) return;
      if (typeof payload?.remaining === "number") setTimeLeft(Number(payload.remaining));
      if (payload?.running !== undefined) setIsRunning(Boolean(payload.running));
      else setIsRunning(false);
    });

    s.on("resume", (payload: any) => {
      if (payload?.id_competencia !== competenciaId) return;
      if (typeof payload?.remaining === "number") setTimeLeft(Number(payload.remaining));
      if (payload?.running !== undefined) setIsRunning(Boolean(payload.running));
      else if (typeof payload?.remaining === "number") setIsRunning(payload.remaining > 0);
      else setIsRunning(true);
    });

    s.on("next", async (payload: any) => {
      if (payload?.id_competencia !== competenciaId) return;
      // admin avanzó al siguiente -> limpiamos freeze para mostrar el nuevo intento real
      setFrozenAttemptKey(null);

      const nextId = payload?.nextId ?? payload?.id_competidor;
      setActiveCompetitorId(nextId ?? null);
      setCurrentEjercicioIndex(0);
      if (typeof payload?.remaining === "number") { setTimeLeft(Number(payload.remaining)); setIsRunning(Number(payload.remaining) > 0); }
      else if (payload?.running !== undefined) setIsRunning(Boolean(payload.running));
      await fetchOrdenPesos();
    });

    return () => {
      try { s.emit("leave", { id_competencia: competenciaId }); } catch { }
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competenciaId]);

  // limpiar freeze si cambia el competidor o ejercicio localmente
  useEffect(() => {
    setFrozenAttemptKey(null);
  }, [activeCompetitorId, currentEjercicioIndex]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isRunning]);

  useEffect(() => {
    if (!activeCompetitorId) {
      setActiveCompetitorDetail(null);
      return;
    }
    void fetchCompetitorDetailAndAttempts(activeCompetitorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompetitorId, competenciaId]);

  const activeCompetitor = listaCompetidores.find((c) => c.id_competidor === activeCompetitorId) ?? null;

  // primer intento pendiente del ejercicio activo -> intento actual
  const isIntentoCurrent = (ej: EjercicioLocal, it: IntentoLocal, ejIndex: number) => {
    if (ejIndex !== currentEjercicioIndex) return false;
    const firstPending = ej.intentos.find(i => i.estado_intento === "pendiente");
    return !!firstPending && firstPending.intento === it.intento;
  };

  const getJudgeId = () => {
    return (juez as any)?.id_juez ?? (juez as any)?.id ?? null;
  };

  // envía la calificación al backend (usa la ruta ya existente)
  async function handleJudgeAttempt(attemptId: number | null, id_competidor: number, exercise_id: number, attempt_number: number, valor: "Bueno" | "Malo") {
    if (!competenciaId) return;
    const judgeId = getJudgeId();
    if (!judgeId) {
      alert("No identificado como juez. Inicia sesión correctamente.");
      return;
    }

    // proteger doble envío (por attemptId)
    if (attemptId && pendingSubmits[attemptId]) return;
    if (attemptId) setPendingSubmits(prev => ({ ...prev, [attemptId]: true }));

    const attemptKey = getAttemptKey(attemptId, id_competidor, exercise_id, attempt_number);

    try {
      const res = await fetch(`${ATTEMPTS_API}/competencias/${competenciaId}/calificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_competidor,
          exercise_id,
          attempt_number,
          judge_id: judgeId,
          valor
        })
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = (json && (json.error || json.message)) ? (json.error || json.message) : "Error al enviar calificación";
        alert(`Error: ${msg}`);
        return;
      }

      const updatedAttempt = json.attempt ?? null;

      setListaCompetidores(prev => {
        const copy = prev.map((c) => ({ ...c, ejercicios: c.ejercicios.map(e => ({ ...e, intentos: e.intentos.map(it => ({ ...it })) })) }));
        const comp = copy.find(c => c.id_competidor === id_competidor);
        if (!comp) return prev;
        const ex = comp.ejercicios.find(e => e.id_ejercicio === exercise_id);
        if (!ex) return prev;
        const slot = attempt_number - 1;
        if (slot < 0 || slot >= ex.intentos.length) return prev;

        ex.intentos[slot].estado_intento = valor === "Bueno" ? "realizado" : "invalidado";
        ex.intentos[slot].resultadoFinal = valor;
        ex.intentos[slot].votedByMe = true;

        if (updatedAttempt) {
          ex.intentos[slot].attemptId = updatedAttempt.id ?? ex.intentos[slot].attemptId;
          ex.intentos[slot].tally = parseNotesTally(updatedAttempt.notes);
        } else {
          ex.intentos[slot].tally = { ...(ex.intentos[slot].tally ?? { Bueno: 0, Malo: 0 }) };
          ex.intentos[slot].tally[valor] = (ex.intentos[slot].tally[valor] ?? 0) + 1;
        }

        return copy;
      });

      // marcar para deshabilitar localmente
      setVotedAttempts(prev => ({ ...prev, [attemptKey]: true }));

      // CONGELAMOS el intento votado para que la UI NO avance automáticamente al siguiente intento
      setFrozenAttemptKey(attemptKey);

    } catch (err) {
      console.error("handleJudgeAttempt error", err);
      alert("Error de red al enviar la calificación");
    } finally {
      if (attemptId) setPendingSubmits(prev => { const cp = { ...prev }; delete cp[attemptId]; return cp; });
    }
  }

  // Helper: devuelve el intento actual (usa frozenAttemptKey si existe; si no, primer pendiente)
  const getCurrentAttemptInfo = () => {
    if (!activeCompetitor) return null;

    // 1) si hay frozenAttemptKey, intentar devolver ese intento (aunque su estado haya cambiado localmente)
    if (frozenAttemptKey) {
      // buscar en ejercicios del competidor
      for (const ej of activeCompetitor.ejercicios) {
        for (const it of ej.intentos) {
          const key = getAttemptKey(it.attemptId, activeCompetitor.id_competidor, ej.id_ejercicio, it.intento);
          if (key === frozenAttemptKey) {
            return {
              exerciseId: ej.id_ejercicio,
              exerciseName: ej.nombre,
              attemptNumber: it.intento,
              weight: it.peso,
              attemptId: it.attemptId ?? null,
              attemptLocal: it
            };
          }
        }
      }
      // si no se encuentra, limpiar freeze y continuar
      setFrozenAttemptKey(null);
    }

    // 2) si no hay frozen, devolver primer pendiente del ejercicio activo (comportamiento anterior)
    const ej = activeCompetitor.ejercicios[currentEjercicioIndex];
    if (!ej) return null;
    const firstPending = ej.intentos.find(i => i.estado_intento === "pendiente");
    if (!firstPending) return null;
    return {
      exerciseId: ej.id_ejercicio,
      exerciseName: ej.nombre,
      attemptNumber: firstPending.intento,
      weight: firstPending.peso,
      attemptId: firstPending.attemptId ?? null,
      attemptLocal: firstPending
    };
  };

  const currentAttempt = getCurrentAttemptInfo();

  // estado disabled del botón global
  const judgeButtonDisabled = (() => {
    if (!currentAttempt) return true; // no hay intento activo
    if (!activeCompetitor) return true;
    // si el intento ya tiene resultado final (ya fue resuelto por backend/admin), no se puede votar
    if (currentAttempt.attemptLocal?.resultadoFinal) return true;
    const attemptKey = getAttemptKey(currentAttempt.attemptId, activeCompetitor.id_competidor, currentAttempt.exerciseId, currentAttempt.attemptNumber);
    if (votedAttempts[attemptKey]) return true;
    // Nota: No bloqueamos por isRunning; permitimos votar aunque el temporizador no haya comenzado.
    return false;
  })();

  return (
    <div className={styles.calificarScreen}>
      <div className={styles.calificarContainer}>
        <h1 className={styles.calificarTitulo}>Visualización de Competidor</h1>

        {competitionName && <div style={{ textAlign: "center", marginBottom: 12, color: "#345" }}><strong>{competitionName}</strong></div>}

        {loading ? (
          <p style={{ textAlign: "center" }}>Cargando...</p>
        ) : !activeCompetitor ? (
          <div className={styles.esperandoAdmin}>
            <p>Esperando selección del administrador...</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>
              <button className={styles.smallAction} onClick={() => void fetchOrdenPesos()}>Actualizar lista</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className={styles.calificarSubtitulo}>
              Competidor #{activeCompetitor.orden} — {activeCompetitor.nombre}
            </h2>

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Peso corporal</div>
                <div style={{ minWidth: 80 }}>{activeCompetitorDetail?.peso ?? "—"} {activeCompetitorDetail?.peso != null ? "kg" : ""}</div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Tiempo restante</div>
                <div className={styles.calificarTiempo}>
                  <span className={styles.timeBig}>{timeLeft}s</span>
                  <div style={{ fontSize: 12, color: isRunning ? "#2e7d32" : "#9e9e9e" }}>{isRunning ? "En curso" : "Pausado"}</div>
                </div>
              </div>
            </div>

            <div className={styles.calificarListaEjercicios}>
              {activeCompetitor.ejercicios.map((ej, idx) => (
                <div key={ej.id_ejercicio} className={`${styles.calificarEjercicio} ${idx === currentEjercicioIndex ? styles.activo : ""}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>{ej.nombre}</h3>
                    {idx === currentEjercicioIndex && <span className={styles.tagActivo}>Activo</span>}
                  </div>

                  <div className={styles.calificarIntentos}>
                    {ej.intentos.map((it) => {
                      const isFinal = it.resultadoFinal === "Bueno" || it.resultadoFinal === "Malo";
                      const isCurrent = isIntentoCurrent(ej, it, idx);

                      const circleClass =
                        it.resultadoFinal === "Bueno" ? styles.bueno :
                          it.resultadoFinal === "Malo" ? styles.malo :
                            it.estado_intento === "realizado" ? styles.bueno :
                              it.estado_intento === "invalidado" ? styles.malo : styles.pendiente;

                      const attemptId = it.attemptId ?? null;
                      const submitting = attemptId ? !!pendingSubmits[attemptId] : false;

                      const attemptKey = getAttemptKey(attemptId, activeCompetitor.id_competidor, ej.id_ejercicio, it.intento);
                      const alreadyVoted = !!votedAttempts[attemptKey] || !!it.votedByMe;

                      return (
                        <div key={it.intento} className={styles.intentoBlock}>
                          <div className={`${styles.intentoCircle} ${circleClass}`} style={isCurrent ? { boxShadow: "0 0 0 3px rgba(25,118,210,0.12)" } : undefined}>
                            <div className={styles.intentoNumber}>{it.intento}</div>
                            {isCurrent && <div style={{ position: "absolute", bottom: -6, fontSize: 10, color: "#1976d2" }}>ACT</div>}
                          </div>

                          <div className={styles.intentoMeta}>
                            <div className={styles.intentoPeso}>{it.peso != null ? `${it.peso} kg` : "—"}</div>
                            <div className={styles.intentoTally}>
                              <small>{(it.tally?.Bueno ?? 0)}✓ / {(it.tally?.Bueno ?? 0) + (it.tally?.Malo ?? 0)}</small>
                            </div>
                            {isFinal && <div className={styles.finalLabel}>{it.resultadoFinal}</div>}
                            {alreadyVoted && <div style={{ marginTop: 6, fontSize: 11, color: "#607d8b" }}>Ya votaste</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {idx === currentEjercicioIndex && <p className={styles.textoActivo}>Ejercicio activo (solo lectura)</p>}
                </div>
              ))}
            </div>

            {/* FOOTER GLOBAL DE CALIFICACIÓN (debajo de toda la lista) */}
            <div className={styles.calificarFooter}>
              <div className={styles.calificarActionsCard}>
                <div className={styles.calificarActionsInfo}>
                  <div className={styles.line1}>
                    {currentAttempt ? `Ejercicio — ${currentAttempt.exerciseName}` : "Sin intento activo"}
                  </div>
                  <div className={styles.line2}>
                    {currentAttempt ? `Intento ${currentAttempt.attemptNumber} · Peso: ${currentAttempt.weight ?? "—"} kg` : "Espera al administrador para seleccionar al competidor/ejercicio."}
                  </div>
                </div>

                <div className={styles.calificarActionsButtons}>
                  <button
                    className={`${styles.btnCalificar} ${styles.btnCalificarLarge} ${styles.maloBtn}`}
                    disabled={judgeButtonDisabled}
                    onClick={() => {
                      if (!currentAttempt || !activeCompetitor) return;
                      void handleJudgeAttempt(currentAttempt.attemptId, activeCompetitor.id_competidor, currentAttempt.exerciseId, currentAttempt.attemptNumber, "Malo");
                    }}
                  >
                    Malo
                  </button>

                  <button
                    className={`${styles.btnCalificar} ${styles.btnCalificarLarge} ${styles.buenoBtn}`}
                    disabled={judgeButtonDisabled}
                    onClick={() => {
                      if (!currentAttempt || !activeCompetitor) return;
                      void handleJudgeAttempt(currentAttempt.attemptId, activeCompetitor.id_competidor, currentAttempt.exerciseId, currentAttempt.attemptNumber, "Bueno");
                    }}
                  >
                    Bueno
                  </button>
                </div>

                <div className={styles.calificarActionsMeta}>
                  <div>{judgeButtonDisabled ? "Botones deshabilitados si ya votaste o no hay intento activo." : "Botones activos — solo califica el intento activo."}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNavigationMenuCentral selected="calificar" />
    </div>
  );
};

export default CalificarScreen;
