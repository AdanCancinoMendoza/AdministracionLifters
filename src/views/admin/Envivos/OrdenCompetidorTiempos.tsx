import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import styles from "../../../styles/AdminOrdenYPesos.module.css";

/* Types & constants */
type Exercise = "Press banca" | "Peso muerto" | "Sentadilla";
const EXERCISES: Exercise[] = ["Press banca", "Peso muerto", "Sentadilla"];
const EXERCISE_NAME_TO_ID: Record<Exercise, number> = { "Press banca": 1, "Peso muerto": 2, "Sentadilla": 3 };

type Competition = { id: string; name: string; startDate: string; endDate: string; imageUrl?: string | null; raw?: any; };
type Competitor = { id: string; name: string; peso?: string | null; edad?: number | null; categoria?: string | null; id_competencia?: string | null; raw?: any; };
type ApiCompetition = { id_competencia: number; nombre: string; foto: string | null; fecha_inicio: string; fecha_cierre: string; [k: string]: any; };
type ApiCompetitor = { id_competidor: number; nombre: string; apellidos?: string; peso?: string; edad?: number; categoria?: string; id_competencia?: number; [k: string]: any; };

const API_BASE = "http://localhost:3001";
const COMPETITIONS_API = `${API_BASE}/api/competenciasadmin`;
const COMPETITORS_API = `${API_BASE}/api/competidor`;
const MODULES_API = `${API_BASE}/api/modules`;
const ATTEMPTS_API = `${API_BASE}/api/attempts`;

/* Component */
export default function CompetitionManager(): JSX.Element {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitorsAll, setCompetitorsAll] = useState<Competitor[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);

  type Card = { tempId: string; moduleId?: number | null; title: string; assigned: string[]; passNumber: number; position?: number; };
  const uid = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;
  const [cards, setCards] = useState<Card[]>([]);
  const [originalAssignments, setOriginalAssignments] = useState<Record<number, string[]>>({});
  const [weights, setWeights] = useState<Record<string, Record<Exercise, (number | null)[]>>>({});
  const [attemptsDone, setAttemptsDone] = useState<Record<string, Record<Exercise, number>>>({});

  const [defaultSeconds, setDefaultSeconds] = useState<number>(60);
  const [currentExercise, setCurrentExercise] = useState<Exercise>(EXERCISES[0]);
  const [attemptRound, setAttemptRound] = useState<number>(1);

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeCompetitorId, setActiveCompetitorId] = useState<string | null>(null);
  const [activeParticipantIndex, setActiveParticipantIndex] = useState<number>(0);

  const [secondsLeft, setSecondsLeft] = useState<number>(defaultSeconds);
  const [running, setRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const [selectedForWeights, setSelectedForWeights] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  /* --------------------- initial fetch --------------------- */
  useEffect(() => {
    const ac = new AbortController();
    setLoadingCompetitions(true);
    (async () => {
      try {
        const res = await fetch(COMPETITIONS_API, { signal: ac.signal });
        const data: ApiCompetition[] = res.ok ? await res.json() : [];
        const mapped = data.map((c) => ({
          id: String(c.id_competencia),
          name: c.nombre,
          startDate: c.fecha_inicio,
          endDate: c.fecha_cierre,
          imageUrl: c.foto ? (c.foto.startsWith("http") ? c.foto : `${API_BASE}${c.foto}`) : null,
          raw: c,
        }));
        setCompetitions(mapped);
        setSelectedCompetitionId((prev) => prev ?? (mapped[0]?.id ?? null));
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message ?? "Error al obtener competencias");
      } finally {
        setLoadingCompetitions(false);
      }
    })();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    setLoadingCompetitors(true);
    (async () => {
      try {
        const res = await fetch(COMPETITORS_API, { signal: ac.signal });
        const data: ApiCompetitor[] = res.ok ? await res.json() : [];
        const mapped = data.map((p) => ({
          id: String(p.id_competidor),
          name: `${p.nombre}${p.apellidos ? " " + p.apellidos : ""}`,
          peso: p.peso ?? null,
          edad: p.edad ?? null,
          categoria: p.categoria ?? null,
          id_competencia: p.id_competencia != null ? String(p.id_competencia) : null,
          raw: p,
        }));
        setCompetitorsAll(mapped);
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message ?? "Error al obtener competidores");
      } finally {
        setLoadingCompetitors(false);
      }
    })();
    return () => ac.abort();
  }, []);

  /* init weights & attempts */
  useEffect(() => {
    setWeights((prev) => {
      const copy = { ...prev };
      competitorsAll.forEach((c) => {
        if (!copy[c.id]) {
          copy[c.id] = { "Press banca": [null, null, null], "Peso muerto": [null, null, null], "Sentadilla": [null, null, null] };
        }
      });
      return copy;
    });
    setAttemptsDone((prev) => {
      const copy: Record<string, Record<Exercise, number>> = { ...prev };
      competitorsAll.forEach((c) => {
        if (!copy[c.id]) copy[c.id] = { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
      });
      return copy;
    });
  }, [competitorsAll]);

  /* --------------------- when competition changes: socket + load modules/attempts --------------------- */
  useEffect(() => {
    if (socketRef.current) {
      try { socketRef.current.emit("leave", { id_competencia: Number(selectedCompetitionId) }); } catch {}
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!selectedCompetitionId) { setCards([]); setOriginalAssignments({}); return; }

    const s = io(API_BASE, { transports: ["websocket"] });
    socketRef.current = s;
    s.on("connect", () => { s.emit("join", { id_competencia: Number(selectedCompetitionId) }); });

    s.on("competitor:selected", (p: any) => {
      if (p?.id_competencia !== Number(selectedCompetitionId)) return;
      const id = p.id_competidor != null ? String(p.id_competidor) : null;
      if (!id) { setActiveCompetitorId(null); return; }
      setActiveCompetitorId(id); setRunning(false); setSecondsLeft(defaultSeconds);
      const card = cards.find((c) => c.assigned.includes(id));
      if (card) {
        setActiveCardId(card.tempId);
        const idx = card.assigned.indexOf(id);
        setActiveParticipantIndex(idx);
        setAttemptRound(computeAttemptRoundForCard(card, currentExercise));
      }
    });

    s.on("start", (p: any) => {
      if (p?.id_competencia !== Number(selectedCompetitionId)) return;
      const id = p.id_competidor != null ? String(p.id_competidor) : null;
      if (id) setActiveCompetitorId(id);
      if (typeof p.remaining === "number") { setSecondsLeft(p.remaining); setRunning(p.remaining > 0); }
    });

    s.on("resume", (p: any) => {
      if (p?.id_competencia !== Number(selectedCompetitionId)) return;
      if (typeof p.remaining === "number") setSecondsLeft(p.remaining);
      setRunning(true);
      if (p.id_competidor != null) setActiveCompetitorId(String(p.id_competidor));
    });

    s.on("pause", (p: any) => {
      if (p?.id_competencia !== Number(selectedCompetitionId)) return;
      if (typeof p.remaining === "number") setSecondsLeft(p.remaining);
      setRunning(false);
    });

    s.on("next", (p: any) => {
      if (p?.id_competencia !== Number(selectedCompetitionId)) return;
      const nextId = p?.nextId != null ? String(p.nextId) : null;
      setActiveCompetitorId(nextId);
      if (typeof p.remaining === "number") { setSecondsLeft(p.remaining); setRunning(p.remaining > 0); } else setRunning(true);
      if (nextId) {
        const c = cards.find((card) => card.assigned.includes(nextId));
        if (c) setActiveCardId(c.tempId);
      }
    });

    s.on("attempt_upsert", (payload: any) => {
      if (payload?.id_competencia !== Number(selectedCompetitionId)) return;
      const id = payload.id_competidor != null ? String(payload.id_competidor) : null; if (!id) return;
      const exName = (Object.keys(EXERCISE_NAME_TO_ID) as Exercise[]).find((k) => EXERCISE_NAME_TO_ID[k] === payload.exercise_id);
      if (!exName) return;
      setWeights((prev) => {
        const copy = { ...prev };
        if (!copy[id]) copy[id] = { "Press banca": [null, null, null], "Peso muerto": [null, null, null], "Sentadilla": [null, null, null] };
        copy[id][exName][(payload.attempt_number ?? 1) - 1] = payload.weight_kg == null ? null : Number(payload.weight_kg);
        return copy;
      });
      if (payload.approved) {
        setAttemptsDone((prev) => {
          const cur = prev[id] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
          const slot = (payload.attempt_number ?? 1);
          return { ...prev, [id]: { ...cur, [exName]: Math.min(3, Math.max(cur[exName] ?? 0, slot)) } };
        });
      }
    });

    s.on("attempt_created", (payload: any) => {
      if (payload?.id_competencia !== Number(selectedCompetitionId)) return;
      const id = payload.id_competidor != null ? String(payload.id_competidor) : null; if (!id) return;
      const exName = (Object.keys(EXERCISE_NAME_TO_ID) as Exercise[]).find((k) => EXERCISE_NAME_TO_ID[k] === payload.exercise_id);
      if (!exName) return;
      setWeights((prev) => {
        const copy = { ...prev };
        if (!copy[id]) copy[id] = { "Press banca": [null, null, null], "Peso muerto": [null, null, null], "Sentadilla": [null, null, null] };
        copy[id][exName][(payload.attempt_number ?? 1) - 1] = payload.weight_kg == null ? null : Number(payload.weight_kg);
        return copy;
      });
      if (payload.approved) {
        setAttemptsDone((prev) => {
          const cur = prev[id] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
          const slot = (payload.attempt_number ?? 1);
          return { ...prev, [id]: { ...cur, [exName]: Math.min(3, Math.max(cur[exName] ?? 0, slot)) } };
        });
      }
    });

    s.on("vote_update", (payload: any) => {
      if (payload?.id_competencia !== Number(selectedCompetitionId)) return;
      const id = payload.id_competidor != null ? String(payload.id_competidor) : null; if (!id) return;
      const exName = (Object.keys(EXERCISE_NAME_TO_ID) as Exercise[]).find((k) => EXERCISE_NAME_TO_ID[k] === payload.id_ejercicio);
      if (!exName) return;
      if (payload.resultadoFinal) {
        setAttemptsDone((prev) => {
          const cur = prev[id] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
          const newVal = Math.min(3, (cur[exName] ?? 0) + 1);
          return { ...prev, [id]: { ...cur, [exName]: newVal } };
        });
      }
    });

    (async () => {
      try {
        const resp = await fetch(`${MODULES_API}?competition_id=${selectedCompetitionId}`);
        if (!resp.ok) { setCards([]); setOriginalAssignments({}); await loadAllAttemptsForCompetition(Number(selectedCompetitionId)); return; }
        const modules = await resp.json();
        const newCards = modules.map((m: any, idx: number) => ({ tempId: `module_${m.id}`, moduleId: m.id ?? null, title: m.title ?? `Módulo ${idx + 1}`, assigned: [], passNumber: m.pass_number ?? 1, position: m.position ?? idx }));
        setCards(newCards);

        const assignMap: Record<number, string[]> = {};
        await Promise.all(newCards.map(async (card) => {
          if (!card.moduleId) return;
          try {
            const r = await fetch(`${MODULES_API}/${card.moduleId}/assignments`);
            if (!r.ok) { assignMap[card.moduleId] = []; return; }
            const assigns = await r.json();
            const ids = assigns.map((a: any) => String(a.id_competidor));
            assignMap[card.moduleId] = ids;
            setCards((prev) => prev.map((c) => (c.moduleId === card.moduleId ? { ...c, assigned: ids } : c)));
          } catch { assignMap[card.moduleId] = []; }
        }));
        setOriginalAssignments(assignMap);
        await loadAllAttemptsForCompetition(Number(selectedCompetitionId));
      } catch (e) { console.warn(e); }
    })();

    return () => { try { s.emit("leave", { id_competencia: Number(selectedCompetitionId) }); } catch {} s.disconnect(); socketRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetitionId, competitorsAll]);

  /* load attempts for competition (count only approved attempts for attemptsDone) */
  async function loadAllAttemptsForCompetition(id_competencia: number) {
    const competitors = competitorsAll.filter((c) => c.id_competencia === String(id_competencia));
    await Promise.all(competitors.map(async (comp) => {
      try {
        const resp = await fetch(`${ATTEMPTS_API}/by-competitor?id_competencia=${id_competencia}&id_competidor=${comp.id}`);
        if (!resp.ok) return;
        const rows = await resp.json();
        setWeights((prev) => {
          const copy = { ...prev };
          if (!copy[comp.id]) copy[comp.id] = { "Press banca": [null, null, null], "Peso muerto": [null, null, null], "Sentadilla": [null, null, null] };
          rows.forEach((r: any) => {
            const exName = (Object.keys(EXERCISE_NAME_TO_ID) as Exercise[]).find((k) => EXERCISE_NAME_TO_ID[k] === r.exercise_id);
            if (exName) copy[comp.id][exName][(r.attempt_number ?? 1) - 1] = r.weight_kg == null ? null : Number(r.weight_kg);
          });
          return copy;
        });

        setAttemptsDone((prev) => {
          const copy = { ...prev };
          if (!copy[comp.id]) copy[comp.id] = { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
          const counts: Record<number, number> = {};
          rows.forEach((r: any) => { if (r.approved) counts[r.exercise_id] = (counts[r.exercise_id] ?? 0) + 1; });
          (Object.keys(EXERCISE_NAME_TO_ID) as Exercise[]).forEach((ex) => {
            copy[comp.id][ex] = counts[EXERCISE_NAME_TO_ID[ex]] ?? 0;
          });
          return copy;
        });
      } catch {}
    }));
  }

  /* helpers */
  const getAttempts = (competitorId: string, exercise: Exercise) => attemptsDone[competitorId]?.[exercise] ?? 0;
  function computeAttemptRoundForCard(card?: Card, exercise?: Exercise) {
    if (!card || card.assigned.length === 0 || !exercise) return 1;
    const vals = card.assigned.map((id) => getAttempts(id, exercise));
    const min = Math.min(...vals);
    return Math.min(3, Math.max(1, 1 + min));
  }
  function findFirstParticipantNeedingAttempt(card?: Card, exercise?: Exercise) {
    if (!card || !exercise) return null;
    for (let i = 0; i < card.assigned.length; i++) if (getAttempts(card.assigned[i], exercise) < 3) return i;
    return null;
  }

  /* Timer */
  useEffect(() => { setSecondsLeft(defaultSeconds); }, [defaultSeconds]);
  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { clearInterval(timerRef.current ?? undefined); timerRef.current = null; setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000) as unknown as number;
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [running]);

  useEffect(() => {
    const card = cards.find((c) => c.tempId === activeCardId);
    if (!card || card.assigned.length === 0) { setAttemptRound(1); setActiveParticipantIndex(0); setActiveCompetitorId(null); setRunning(false); setSecondsLeft(defaultSeconds); return; }
    if (activeCompetitorId && card.assigned.includes(activeCompetitorId) && getAttempts(activeCompetitorId, currentExercise) < 3) {
      setActiveParticipantIndex(card.assigned.indexOf(activeCompetitorId));
      setAttemptRound(computeAttemptRoundForCard(card, currentExercise));
      setRunning(false);
      setSecondsLeft(defaultSeconds);
      return;
    }
    const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
    if (idx != null) { setActiveParticipantIndex(idx); setActiveCompetitorId(card.assigned[idx]); setAttemptRound(computeAttemptRoundForCard(card, currentExercise)); } else { setActiveCompetitorId(null); setActiveParticipantIndex(0); setAttemptRound(computeAttemptRoundForCard(card, currentExercise)); }
    setRunning(false); setSecondsLeft(defaultSeconds);
  }, [activeCardId, attemptsDone, cards, currentExercise]);

  useEffect(() => {
    const card = cards.find((c) => c.tempId === activeCardId); if (!card) { setAttemptRound(1); return; }
    setAttemptRound(computeAttemptRoundForCard(card, currentExercise));
    if (activeCompetitorId) {
      const attemptsForNew = getAttempts(activeCompetitorId, currentExercise);
      if (attemptsForNew >= 3) {
        const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
        if (idx != null) { setActiveParticipantIndex(idx); setActiveCompetitorId(card.assigned[idx]); } else { setActiveCompetitorId(null); setActiveParticipantIndex(0); }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise]);

  /* CRUD helpers */
  async function createModuleOnServer(title = "Módulo", pass_number = 1) {
    if (!selectedCompetitionId) return null;
    try {
      const resp = await fetch(`${MODULES_API}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_competencia: Number(selectedCompetitionId), title, pass_number }) });
      if (!resp.ok) return null;
      const json = await resp.json(); return json.id as number;
    } catch { return null; }
  }
  async function patchModuleOnServer(moduleId: number, payload: { title?: string; pass_number?: number; position?: number }) {
    try { await fetch(`${MODULES_API}/${moduleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch {}
  }

  /* Add/assign/remove cards */
  async function addCard() {
    if (selectedCompetitionId) {
      const moduleId = await createModuleOnServer(`Módulo ${cards.length + 1}`, 1);
      const temp = moduleId ? `module_${moduleId}` : uid("card_");
      setCards((prev) => [...prev, { tempId: temp, moduleId: moduleId ?? null, title: `Módulo ${prev.length + 1}`, assigned: [], passNumber: 1, position: prev.length }]);
      if (moduleId) setOriginalAssignments((o) => ({ ...o, [moduleId]: [] }));
    } else setCards((prev) => [...prev, { tempId: uid("card_"), moduleId: null, title: `Módulo ${prev.length + 1}`, assigned: [], passNumber: 1, position: prev.length }]);
  }

  async function assignCompetitorToCard(cardTempId: string, competitorId: string) {
    setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, assigned: c.assigned.includes(competitorId) ? c.assigned : [...c.assigned, competitorId] } : c)));
    const card = cards.find((c) => c.tempId === cardTempId);
    if (card?.moduleId) {
      try {
        const resp = await fetch(`${MODULES_API}/${card.moduleId}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_competidor: Number(competitorId) }) });
        if (resp.ok) {
          const r2 = await fetch(`${MODULES_API}/${card.moduleId}/assignments`);
          if (r2.ok) { const assigns = await r2.json(); const ids = assigns.map((a: any) => String(a.id_competidor)); setCards((prev) => prev.map((c) => (c.moduleId === card.moduleId ? { ...c, assigned: ids } : c))); setOriginalAssignments((o) => ({ ...o, [card.moduleId as number]: ids })); }
        }
      } catch (err) { console.warn(err); }
    }
  }

  async function removeCompetitorFromCard(cardTempId: string, competitorId: string) {
    const card = cards.find((c) => c.tempId === cardTempId);
    if (!card) {
      setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, assigned: c.assigned.filter((id) => id !== competitorId) } : c)));
      return;
    }
    if (card.moduleId) {
      try {
        await fetch(`${MODULES_API}/${card.moduleId}/assign/${competitorId}`, { method: "DELETE" });
        const r = await fetch(`${MODULES_API}/${card.moduleId}/assignments`);
        if (r.ok) { const assigns = await r.json(); const ids = assigns.map((a: any) => String(a.id_competidor)); setCards((prev) => prev.map((c) => (c.moduleId === card.moduleId ? { ...c, assigned: ids } : c))); setOriginalAssignments((o) => ({ ...o, [card.moduleId as number]: ids })); }
        else setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, assigned: c.assigned.filter((id) => id !== competitorId) } : c)));
      } catch (err) { console.warn(err); setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, assigned: c.assigned.filter((id) => id !== competitorId) } : c))); }
    } else setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, assigned: c.assigned.filter((id) => id !== competitorId) } : c)));
    if (selectedForWeights === competitorId) setSelectedForWeights(null);
    if (activeCompetitorId === competitorId) { setActiveCompetitorId(null); setActiveCardId(null); }
  }

  /* weight inputs & save */
  function setWeightForAttempt(competitorId: string, exercise: Exercise, attemptIndex: number, value: number | null) {
    setWeights((prev) => ({ ...prev, [competitorId]: { ...prev[competitorId], [exercise]: prev[competitorId][exercise].map((v, i) => (i === attemptIndex ? value : v)) } }));
  }

  async function saveWeightToServer(id_competidor: string, exercise: Exercise, attemptIndex: number, value: number | null) {
    if (!selectedCompetitionId) return;
    const exercise_id = EXERCISE_NAME_TO_ID[exercise];
    try {
      const resp = await fetch(`${ATTEMPTS_API}/upsert-weight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_competencia: Number(selectedCompetitionId),
          id_competidor: Number(id_competidor),
          exercise_id,
          attempt_number: attemptIndex + 1,
          weight_kg: value,
          module_id: (() => { const card = cards.find((c) => c.assigned.includes(id_competidor)); return card?.moduleId ?? null; })(),
        }),
      });
      if (!resp.ok) console.warn("Error saving weight:", await resp.text());
      // server emits attempt_created/upsert or vote_update when final.
    } catch (err) { console.error("saveWeightToServer error", err); }
  }

  function handleAttemptInputBlur(competitorId: string, exercise: Exercise, attemptIndex: number) {
    const val = weights[competitorId]?.[exercise]?.[attemptIndex] ?? null;
    saveWeightToServer(competitorId, exercise, attemptIndex, val);
  }

  /* select competitor */
  async function selectCompetitorToCompete(cardTempId: string, competitorId: string) {
    const card = cards.find((c) => c.tempId === cardTempId); if (!card) return;
    const idx = card.assigned.indexOf(competitorId); if (idx < 0) return;
    setActiveCardId(cardTempId); setActiveCompetitorId(competitorId); setActiveParticipantIndex(idx); setAttemptRound(computeAttemptRoundForCard(card, currentExercise)); setSecondsLeft(defaultSeconds); setRunning(false);

    if (card.moduleId) {
      try {
        const resp = await fetch(`${MODULES_API}/${card.moduleId}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null,
            id_competidor: Number(competitorId),
            id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise],
            source: "admin_ui",
            timestamp: Date.now(),
          }),
        });
        if (!resp.ok) {
          try { socketRef.current?.emit("competitor:selected", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_competidor: Number(competitorId), id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], source: "admin_ui_fallback", timestamp: Date.now() }); } catch {}
        }
      } catch (err) {
        console.warn("select API failed, fallback to socket", err);
        try { socketRef.current?.emit("competitor:selected", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_competidor: Number(competitorId), id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], source: "admin_ui_fallback", timestamp: Date.now() }); } catch {}
      }
    } else {
      try { socketRef.current?.emit("competitor:selected", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_competidor: Number(competitorId), id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], source: "admin_ui", timestamp: Date.now() }); } catch {}
    }
  }

  /* start block */
  async function startBlock(cardTempId: string) {
    const card = cards.find((c) => c.tempId === cardTempId); if (!card || card.assigned.length === 0) return alert("El card no tiene participantes asignados");
    setActiveCardId(cardTempId);
    let chosenCompetitorId: string | null = null;
    if (card.moduleId) {
      try {
        const r = await fetch(`${MODULES_API}/${card.moduleId}/next?exercise_id=${EXERCISE_NAME_TO_ID[currentExercise]}`);
        if (r.ok) {
          const json = await r.json();
          const next = json?.next ?? null;
          if (next && next.id_competidor != null) {
            const idStr = String(next.id_competidor);
            if (card.assigned.includes(idStr)) {
              setActiveParticipantIndex(card.assigned.indexOf(idStr));
              setActiveCompetitorId(idStr);
              chosenCompetitorId = idStr;
            }
          }
        }
      } catch (err) { console.warn("Error fetching next:", err); }
    }
    if (!chosenCompetitorId) {
      const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
      if (idx != null) { setActiveParticipantIndex(idx); setActiveCompetitorId(card.assigned[idx]); chosenCompetitorId = card.assigned[idx]; }
      else { setActiveParticipantIndex(0); setActiveCompetitorId(card.assigned[0]); chosenCompetitorId = card.assigned[0]; }
    }
    const newRound = computeAttemptRoundForCard(card, currentExercise); setAttemptRound(newRound); setSecondsLeft(defaultSeconds); setRunning(false);

    if (card.moduleId) {
      try {
        const r = await fetch(`${MODULES_API}/${card.moduleId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_competencia: Number(selectedCompetitionId), id_competidor: chosenCompetitorId ? Number(chosenCompetitorId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], started_by: null, remaining: defaultSeconds }),
        });
        if (!r.ok) {
          console.warn("POST /start returned", r.status, await r.text().catch(() => ""));
          try { socketRef.current?.emit("start", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_competidor: chosenCompetitorId ? Number(chosenCompetitorId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: defaultSeconds, source: "admin_ui_fallback", timestamp: Date.now() }); } catch {}
        }
      } catch (err) { console.warn("start API failed, fallback to socket", err); try { socketRef.current?.emit("start", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_competidor: chosenCompetitorId ? Number(chosenCompetitorId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: defaultSeconds, source: "admin_ui_fallback", timestamp: Date.now() }); } catch {} }
    } else {
      try { socketRef.current?.emit("start", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_competidor: chosenCompetitorId ? Number(chosenCompetitorId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: defaultSeconds, source: "admin_ui", timestamp: Date.now() }); } catch {}
    }
  }

  /* next participant/round/exercise */
  function goToNextParticipantOrRound() {
    if (!activeCardId || !activeCompetitorId) return;
    const card = cards.find((c) => c.tempId === activeCardId); if (!card) return;

    setAttemptsDone((prev) => {
      const current = prev[activeCompetitorId] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
      const curVal = current[currentExercise] ?? 0;
      if (curVal >= 3) return prev;
      return { ...prev, [activeCompetitorId]: { ...current, [currentExercise]: curVal + 1 } };
    });

    const snapshot: Record<string, Record<Exercise, number>> = {};
    Object.keys(attemptsDone).forEach((k) => (snapshot[k] = { ...attemptsDone[k] } as any));
    const cur = snapshot[activeCompetitorId] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
    snapshot[activeCompetitorId] = { ...cur, [currentExercise]: Math.min(3, (cur as any)[currentExercise] + 1) };

    const getSnapAttempts = (competitorId: string) => snapshot[competitorId]?.[currentExercise] ?? 0;
    const total = card.assigned.length;
    let foundIdx: number | null = null;
    for (let i = activeParticipantIndex + 1; i < total; i++) if (getSnapAttempts(card.assigned[i]) < 3) { foundIdx = i; break; }
    if (foundIdx == null) for (let i = 0; i <= activeParticipantIndex; i++) if (getSnapAttempts(card.assigned[i]) < 3) { foundIdx = i; break; }

    if (foundIdx != null) {
      setActiveParticipantIndex(foundIdx); setActiveCompetitorId(card.assigned[foundIdx]); setSecondsLeft(defaultSeconds); setRunning(false);
      const vals = card.assigned.map((id) => snapshot[id]?.[currentExercise] ?? 0); const min = Math.min(...vals); setAttemptRound(Math.min(3, Math.max(1, 1 + min)));
      if (card.moduleId) { try { fetch(`${MODULES_API}/${card.moduleId}/next?exercise_id=${EXERCISE_NAME_TO_ID[currentExercise]}`).catch(() => {}); } catch {} }
      try { socketRef.current?.emit("next", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, nextId: Number(card.assigned[foundIdx]), id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: defaultSeconds, source: "admin_ui", timestamp: Date.now() }); } catch {}
      return;
    }

    const valsAfter = card.assigned.map((id) => snapshot[id]?.[currentExercise] ?? 0); const minAfter = Math.min(...valsAfter);
    if (minAfter < 3) {
      const newRound = Math.min(3, 1 + minAfter); setAttemptRound(newRound);
      const firstIdx = card.assigned.findIndex((id) => snapshot[id]?.[currentExercise] < 3);
      if (firstIdx >= 0) {
        setActiveParticipantIndex(firstIdx); setActiveCompetitorId(card.assigned[firstIdx]); setSecondsLeft(defaultSeconds); setRunning(false);
        try { socketRef.current?.emit("next", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, nextId: Number(card.assigned[firstIdx]), id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: defaultSeconds, source: "admin_ui", timestamp: Date.now() }); } catch {}
        return;
      }
    }

    const nextExerciseIndex = EXERCISES.indexOf(currentExercise) + 1;
    if (nextExerciseIndex < EXERCISES.length) {
      setCurrentExercise(EXERCISES[nextExerciseIndex]);
      try { socketRef.current?.emit("order_update", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[EXERCISES[nextExerciseIndex]], source: "admin_ui", timestamp: Date.now() }); } catch {}
      return;
    }

    alert("Bloque completado: todos los ejercicios e intentos terminados.");
    setActiveCardId(null); setActiveCompetitorId(null); setRunning(false);
    try { socketRef.current?.emit("next", { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, nextId: null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: 0, source: "admin_ui", timestamp: Date.now() }); } catch {}
  }

  function handleNextFromBottom() { setRunning(false); goToNextParticipantOrRound(); }

  /* ---------------------
     tryModulePost: try multiple candidate endpoints quietly (no spam 404)
  --------------------- */
  async function tryModulePost(moduleId: number | null, pathCandidates: string[], payload: any) {
    if (!moduleId) return { ok: false, details: ["no moduleId"] };
    const details: Array<{ url: string; status?: number; text?: string; error?: any }> = [];
    for (const p of pathCandidates) {
      const url = `${MODULES_API}/${moduleId}/${p}`;
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const text = await r.text().catch(() => "");
        if (r.ok) return { ok: true, url, text };
        // treat 404 as "not implemented" quietly (do not spam console)
        details.push({ url, status: r.status, text });
      } catch (err) {
        details.push({ url, error: err });
      }
    }
    // none succeeded
    return { ok: false, details };
  }

  /* ---------------------
     START: try /resume first then /start then socket fallback
  --------------------- */
  async function handleStart() {
    if (!activeCompetitorId) return alert("Selecciona primero un competidor para competir");

    // compute remaining deterministically (avoid race with setState)
    const remainingSeconds = secondsLeft > 0 ? secondsLeft : defaultSeconds;

    // mark running immediately (timer effect reads `running`)
    setRunning(true);

    const card = cards.find((c) => c.tempId === activeCardId);
    const payload = { id_competencia: selectedCompetitionId ? Number(selectedCompetitionId) : null, id_competidor: activeCompetitorId ? Number(activeCompetitorId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: remainingSeconds, source: "admin_ui", timestamp: Date.now() };

    if (card?.moduleId) {
      // try resume first (prefer resume semantics)
      const tryResume = await tryModulePost(card.moduleId, ["resume"], payload);
      if (tryResume.ok) return;
      // then try start
      const tryStart = await tryModulePost(card.moduleId, ["start"], payload);
      if (tryStart.ok) return;
      // fallback socket emit 'resume' (judges expect resume to resume timer)
      try { socketRef.current?.emit("resume", payload); } catch (e) { console.warn("socket emit resume fallback failed", e); }
    } else {
      try { socketRef.current?.emit("resume", payload); } catch (e) { console.warn("socket emit resume failed", e); }
    }
  }

  /* ---------------------
     PAUSE: try reset first (since your server exposes reset), then pause/stop/end -> fallback socket
  --------------------- */
  async function handlePause() {
    setRunning(false);
    const card = cards.find((c) => c.tempId === activeCardId);
    const payload = { id_competencia: Number(selectedCompetitionId), id_competidor: activeCompetitorId ? Number(activeCompetitorId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: secondsLeft, source: "admin_ui", timestamp: Date.now() };

    const candidates = ["reset", "pause", "stop", "end"];
    if (card?.moduleId) {
      const resp = await tryModulePost(card.moduleId, candidates, payload);
      if (resp.ok) {
        try { socketRef.current?.emit("pause", payload); } catch (e) { /* best-effort */ }
        return;
      } else {
        // none of the endpoints exist/ok: fallback to socket (single concise log)
        console.info("Ningún endpoint de pause/reset respondió OK — usando socket fallback.");
        try { socketRef.current?.emit("pause", { ...payload, source: "admin_ui_fallback" }); } catch (e) { console.warn("socket emit pause fallback failed", e); }
        return;
      }
    }
    try { socketRef.current?.emit("pause", payload); } catch (e) { console.warn("socket emit pause failed", e); }
  }

  /* ---------------------
     RESET timer (reiniciar): try reset then pause fallback
  --------------------- */
  async function handleResetTimer() {
    setRunning(false);
    setSecondsLeft(defaultSeconds);
    const card = cards.find((c) => c.tempId === activeCardId);
    const payload = { id_competencia: Number(selectedCompetitionId), id_competidor: activeCompetitorId ? Number(activeCompetitorId) : null, id_ejercicio: EXERCISE_NAME_TO_ID[currentExercise], remaining: defaultSeconds, source: "admin_ui", timestamp: Date.now() };

    const candidates = ["reset", "pause", "stop", "end"];
    if (card?.moduleId) {
      const resp = await tryModulePost(card.moduleId, candidates, payload);
      if (resp.ok) {
        try { socketRef.current?.emit("pause", payload); } catch {}
        return;
      } else {
        console.info("Ningún endpoint de reset/pause respondió OK — usando socket fallback.");
        try { socketRef.current?.emit("pause", { ...payload, source: "admin_ui_fallback" }); } catch {}
        return;
      }
    }
    try { socketRef.current?.emit("pause", payload); } catch {}
  }

  /* reset all attempts (server) */
  async function resetAllAttempts() {
    if (!selectedCompetitionId) return alert("Selecciona una competencia primero");
    if (!confirm("¿Seguro quieres reiniciar TODOS los intentos de esta competencia?")) return;
    try {
      const resp = await fetch(`${ATTEMPTS_API}/reset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_competencia: Number(selectedCompetitionId) }) });
      if (!resp.ok) { alert("No se pudo reiniciar los intentos en el servidor."); return; }
      const competitors = competitorsAll.filter((c) => c.id_competencia === selectedCompetitionId).map((c) => c.id);
      setWeights((prev) => {
        const copy = { ...prev };
        competitors.forEach((id) => { copy[id] = { "Press banca": [null, null, null], "Peso muerto": [null, null, null], "Sentadilla": [null, null, null] }; });
        return copy;
      });
      setAttemptsDone((prev) => {
        const copy = { ...prev };
        competitors.forEach((id) => { copy[id] = { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 }; });
        return copy;
      });
      alert("Intentos reiniciados correctamente.");
    } catch (err) { console.error(err); alert("Ocurrió un error al reiniciar intentos."); }
  }

  /* save all (modules/assignments/weights) - unchanged logic (trimmed here but same behaviour) */
  async function saveAllToServer() {
    if (!selectedCompetitionId) return alert("Selecciona una competencia antes de guardar.");
    setSaving(true);
    try {
      // ensure modules exist & patch them, sync assignments and upsert weights
      const updatedCards = [...cards];
      for (let i = 0; i < updatedCards.length; i++) {
        const c = updatedCards[i];
        if (!c.moduleId) {
          const createdId = await createModuleOnServer(c.title, c.passNumber);
          if (createdId) { c.moduleId = createdId; c.tempId = `module_${createdId}`; setOriginalAssignments((o) => ({ ...o, [createdId]: [] })); }
        } else await patchModuleOnServer(c.moduleId, { title: c.title, pass_number: c.passNumber, position: c.position ?? i });
      }
      setCards(updatedCards);

      for (const card of updatedCards) {
        if (!card.moduleId) continue;
        const mid = card.moduleId;
        const serverList = originalAssignments[mid] ?? [];
        const localList = card.assigned;
        const toAdd = localList.filter((id) => !serverList.includes(id));
        const toRemove = serverList.filter((id) => !localList.includes(id));
        await Promise.all(toRemove.map(async (competitorId) => { try { await fetch(`${MODULES_API}/${mid}/assign/${competitorId}`, { method: "DELETE" }); } catch {} }));
        for (const competitorId of toAdd) {
          try { await fetch(`${MODULES_API}/${mid}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_competidor: Number(competitorId) }) }); } catch {}
        }
        try {
          const r = await fetch(`${MODULES_API}/${mid}/assignments`);
          if (r.ok) { const assigns = await r.json(); const ids = assigns.map((a: any) => String(a.id_competidor)); setCards((prev) => prev.map((c) => (c.moduleId === mid ? { ...c, assigned: ids } : c))); setOriginalAssignments((o) => ({ ...o, [mid]: ids })); }
          else setOriginalAssignments((o) => ({ ...o, [mid]: [...localList] }));
        } catch { setOriginalAssignments((o) => ({ ...o, [mid]: [...localList] })); }
      }

      for (const competitorId of Object.keys(weights)) {
        const exercises = weights[competitorId];
        for (const ex of Object.keys(exercises) as Exercise[]) {
          const arr = exercises[ex];
          for (let i = 0; i < arr.length; i++) {
            const val = arr[i];
            if (val != null) {
              try {
                await fetch(`${ATTEMPTS_API}/upsert-weight`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id_competencia: Number(selectedCompetitionId), id_competidor: Number(competitorId), exercise_id: EXERCISE_NAME_TO_ID[ex], attempt_number: i + 1, weight_kg: val, module_id: (() => { const card = cards.find((c) => c.assigned.includes(competitorId)); return card?.moduleId ?? null; })() }),
                });
              } catch {}
            }
          }
        }
      }

      await loadAllAttemptsForCompetition(Number(selectedCompetitionId));
      alert("Guardado completado.");
    } catch (err) { console.error("saveAllToServer error", err); alert("Ocurrió un error al guardar. Revisa la consola."); } finally { setSaving(false); }
  }

  /* small render utils */
  const selectedCompetition = competitions.find((c) => c.id === selectedCompetitionId) ?? null;
  const competitionConcluded = selectedCompetition ? new Date(selectedCompetition.endDate) < new Date() : false;
  const competitorsOfSelected = competitorsAll.filter((p) => p.id_competencia === selectedCompetitionId);
  const assignedIdsSet = new Set(cards.flatMap((c) => c.assigned));
  const availableCompetitors = competitorsOfSelected.filter((c) => !assignedIdsSet.has(c.id));
  const assignedCompetitors = cards.flatMap((card) => card.assigned.map((id) => ({ id, cardTitle: card.title })));
  const nameOf = (id?: string | null) => competitorsAll.find((x) => x.id === id)?.name ?? "—";
  const formatDate = (iso?: string | null) => !iso ? "—" : new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

  /* render (igual estructura) */
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestión de Competencia</h2>

      <div className={styles.controlsRow}>
        <label className={styles.label}>Seleccionar competencia:</label>
        <select className={styles.select} value={selectedCompetitionId ?? ""} onChange={(e) => setSelectedCompetitionId(e.target.value || null)} disabled={loadingCompetitions}>
          {loadingCompetitions && <option value="">Cargando competencias...</option>}
          {!loadingCompetitions && competitions.length === 0 && <option value="">Sin competencias</option>}
          {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {loadingCompetitors && <div className={styles.hint}>Cargando competidores...</div>}
        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className={styles.addBtn} onClick={() => addCard()} disabled={!selectedCompetitionId}>+ Añadir card</button>
          <button className={styles.primaryBtn} onClick={saveAllToServer} disabled={saving || !selectedCompetitionId}>{saving ? "Guardando..." : "Guardar cambios"}</button>
          <button className={styles.smallBtn} onClick={resetAllAttempts} disabled={!selectedCompetitionId}>Reiniciar intentos</button>
        </div>
      </div>

      {selectedCompetition ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 140, height: 90, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "#f3f6ff" }}>
            {selectedCompetition.imageUrl ? <img src={selectedCompetition.imageUrl} alt={selectedCompetition.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#7b8794" }}>Sin imagen</div>}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 800 }}>{selectedCompetition.name}</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Inicio: <strong>{formatDate(selectedCompetition.startDate)}</strong></div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Cierre: <strong>{formatDate(selectedCompetition.endDate)}</strong></div>
            <div style={{ marginTop: 6 }}>{competitionConcluded ? <span className={styles.concluded}>Competencia ya concluida</span> : <span style={{ color: "var(--muted)", fontSize: 13 }}>Competencia activa / próxima</span>}</div>
          </div>
        </div>
      ) : <div className={styles.hint}>Selecciona una competencia para ver sus datos</div>}

      {loadingCompetitions || loadingCompetitors ? <div className={styles.hint}>Cargando datos...</div> : error ? <div style={{ color: "var(--danger)" }}>{error}</div> : (
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <div className={styles.sectionHeader}><h3>Cards / Módulos</h3></div>

            <div className={styles.cardsList}>
              {cards.map((card) => (
                <div key={card.tempId} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <input className={styles.cardTitle} value={card.title} onChange={(e) => setCards((prev) => prev.map((c) => (c.tempId === card.tempId ? { ...c, title: e.target.value } : c)))} />
                    <div className={styles.cardActions}>
                      <label>Pasarán:</label>
                      <input type="number" min={1} value={card.passNumber} onChange={(e) => setCards((prev) => prev.map((c) => (c.tempId === card.tempId ? { ...c, passNumber: Math.max(1, Number(e.target.value || 1)) } : c)))} className={styles.smallNumber} />
                      <button className={styles.smallBtn} onClick={() => setCards((prev) => prev.filter((c) => c.tempId !== card.tempId))}>Eliminar</button>
                      <button className={styles.primaryBtn} onClick={() => startBlock(card.tempId)}>Iniciar bloque</button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.assignedList}>
                      {card.assigned.map((id) => {
                        const competitor = competitorsAll.find((c) => c.id === id);
                        return (
                          <div key={id} className={styles.assignedItem}>
                            <div>
                              <strong>{competitor ? competitor.name : nameOf(id)}</strong>
                              <div className={styles.assignedMeta}>ID: {id} — Peso: <strong>{competitor?.peso ?? "—"} kg</strong> • Cat: <strong>{competitor?.categoria ?? "—"}</strong></div>
                            </div>
                            <div className={styles.assignedBtns}>
                              <button className={styles.tinyBtn} onClick={() => setSelectedForWeights(id)}>Pesos</button>
                              <button className={styles.tinyBtn} onClick={() => selectCompetitorToCompete(card.tempId, id)} title="Seleccionar para competir">Seleccionar</button>
                              <button className={styles.tinyBtn} onClick={() => removeCompetitorFromCard(card.tempId, id)}>Quitar</button>
                            </div>
                          </div>
                        );
                      })}
                      {card.assigned.length === 0 && <div className={styles.hint}>No hay competidores asignados</div>}
                    </div>

                    <div className={styles.assignRow}>
                      <select value={""} onChange={(e) => { if (e.target.value) { assignCompetitorToCard(card.tempId, e.target.value); e.currentTarget.value = ""; } }} className={styles.addSelect}>
                        <option value="">Agregar competidor...</option>
                        {availableCompetitors.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.peso ?? "—"}kg — {p.categoria ?? "—"}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {cards.length === 0 && <div className={styles.hint}>No hay módulos — crea uno con "+ Añadir card"</div>}
            </div>
          </div>

          <div className={styles.rightCol}>
            <h3>Competidores disponibles en "{selectedCompetition?.name ?? "—"}"</h3>
            <ul className={styles.availableList}>
              {availableCompetitors.map((p) => (
                <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Peso: <strong>{p.peso ?? "—"} kg</strong> • Categoría: <strong>{p.categoria ?? "—"}</strong></div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Disponible</div>
                </li>
              ))}
              {availableCompetitors.length === 0 && <li className={styles.hint}>No hay competidores disponibles (todos asignados o sin inscritos)</li>}
            </ul>

            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: "8px 0" }}>Asignados a módulos</h4>
              {assignedCompetitors.length > 0 ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {assignedCompetitors.map((a) => <li key={a.id} style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0" }}>{nameOf(a.id)} <span style={{ fontWeight: 700 }}>— {a.cardTitle}</span></li>)}
                </ul>
              ) : <div className={styles.hint}>No hay competidores asignados todavía</div>}
            </div>

            <div className={styles.weightsPanel} style={{ marginTop: 16 }}>
              <h3>Tabla de Pesos</h3>
              {selectedForWeights ? (
                <div className={styles.weightCard}>
                  <div className={styles.weightHeader}>
                    <strong>{nameOf(selectedForWeights)}</strong>
                    <button className={styles.smallBtn} onClick={() => setSelectedForWeights(null)}>Cerrar</button>
                  </div>

                  {EXERCISES.map((ex) => (
                    <div key={ex} className={styles.exerciseRow}>
                      <div className={styles.exerciseLabel}>{ex}</div>
                      <div className={styles.attemptsRow}>
                        {weights[selectedForWeights!]?.[ex].map((val, i) => (
                          <input key={i} type="number" placeholder={`Intento ${i + 1}`} value={val ?? ""} onChange={(e) => setWeightForAttempt(selectedForWeights!, ex, i, e.target.value === "" ? null : Number(e.target.value))} onBlur={() => handleAttemptInputBlur(selectedForWeights!, ex, i)} className={styles.attemptInput} />
                        ))}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Intentos completados: <strong>{attemptsDone[selectedForWeights!]?.[ex] ?? 0}</strong> / 3</div>
                    </div>
                  ))}
                </div>
              ) : <div className={styles.hint}>Selecciona un competidor (Pesos) para editar sus intentos</div>}
            </div>

            <div className={styles.timerSetup}>
              <label>Segundos por participante:</label>
              <input type="number" min={10} value={defaultSeconds} onChange={(e) => setDefaultSeconds(Math.max(10, Number(e.target.value || 60)))} className={styles.smallNumber} />
              <div className={styles.exerciseSelector}>
                <label>Ejercicio actual:</label>
                <select value={currentExercise} onChange={(e) => setCurrentExercise(e.target.value as Exercise)}>{EXERCISES.map((ex) => <option key={ex} value={ex}>{ex}</option>)}</select>
              </div>

              <div className={styles.blockStatus}>
                <div>Card activo: {activeCardId ? cards.find((c) => c.tempId === activeCardId)?.title : "—"}</div>
                <div>Intento (ronda): {attemptRound} / 3</div>
                <div>Participante activo: {activeCompetitorId ? nameOf(activeCompetitorId) : "—"} {activeCompetitorId && <span className={styles.activeMeta}>(index {activeParticipantIndex + 1})</span>}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer} />

      <div className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          <div className={styles.activeName}>{activeCompetitorId ? nameOf(activeCompetitorId) : "Sin competidor seleccionado"}</div>
          <div className={styles.activeMetaSmall}>{activeCardId ? cards.find((c) => c.tempId === activeCardId)?.title : ""} • {currentExercise} • Intento {attemptRound}/3</div>
        </div>

        <div className={styles.bottomCenter}><div className={styles.timerDisplay}>{secondsLeft}s</div></div>

        <div className={styles.bottomRight}>
          <button className={styles.smallBtn} onClick={handleStart} title="Iniciar">▶︎</button>
          <button className={styles.smallBtn} onClick={handlePause} title="Pausar">⏸</button>
          <button className={styles.smallBtn} onClick={handleResetTimer} title="Reiniciar">⟲</button>
          <button className={styles.primaryBtn} onClick={handleNextFromBottom} title="Siguiente participante / intento">Siguiente</button>
        </div>
      </div>
    </div>
  );
}

/* fin del archivo */
