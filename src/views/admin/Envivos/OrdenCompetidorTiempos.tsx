// src/components/CompetitionManager.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/AdminOrdenYPesos.module.css";

/* -----------------------
  Tipos y constantes
------------------------*/
type Exercise = "Press banca" | "Peso muerto" | "Sentadilla";
const EXERCISES: Exercise[] = ["Press banca", "Peso muerto", "Sentadilla"];

const EXERCISE_NAME_TO_ID: Record<Exercise, number> = {
  "Press banca": 1,
  "Peso muerto": 2,
  "Sentadilla": 3,
};

type Competition = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  eventDate?: string;
  imageUrl?: string | null;
  raw?: any;
};

type Competitor = {
  id: string;
  name: string;
  peso?: string | null;
  edad?: number | null;
  categoria?: string | null;
  id_competencia?: string | null;
  raw?: any;
};

type ApiCompetition = {
  id_competencia: number;
  nombre: string;
  foto: string | null;
  fecha_inicio: string;
  fecha_cierre: string;
  fecha_evento?: string;
  [k: string]: any;
};

type ApiCompetitor = {
  id_competidor: number;
  nombre: string;
  apellidos?: string;
  peso?: string;
  edad?: number;
  categoria?: string;
  id_competencia?: number;
  [k: string]: any;
};

const API_BASE = "http://localhost:3001";
const COMPETITIONS_API = `${API_BASE}/api/competenciasadmin`;
const COMPETITORS_API = `${API_BASE}/api/competidor`;
const MODULES_API = `${API_BASE}/api/modules`;
const ATTEMPTS_API = `${API_BASE}/api/attempts`;

/* -----------------------
  Componente
------------------------*/
export default function CompetitionManager(): JSX.Element {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitorsAll, setCompetitorsAll] = useState<Competitor[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);

  type Card = {
    tempId: string;
    moduleId?: number | null;
    title: string;
    assigned: string[];
    passNumber: number;
    position?: number;
  };
  const uid = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;
  const [cards, setCards] = useState<Card[]>([]);

  // originalAssignments[moduleId] = server-assigned-list (para calcular diffs)
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

  /* -----------------------
     Fetch inicial: competencias
  ---------------------*/
  useEffect(() => {
    const ac = new AbortController();
    setLoadingCompetitions(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(COMPETITIONS_API, { signal: ac.signal });
        if (!res.ok) throw new Error(`Error fetching competitions: ${res.status}`);
        const data: ApiCompetition[] = await res.json();
        const mapped: Competition[] = data.map((c) => ({
          id: String(c.id_competencia),
          name: c.nombre,
          startDate: c.fecha_inicio,
          endDate: c.fecha_cierre,
          eventDate: c.fecha_evento,
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

  /* -----------------------
     Fetch inicial: competidores
  ---------------------*/
  useEffect(() => {
    const ac = new AbortController();
    setLoadingCompetitors(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(COMPETITORS_API, { signal: ac.signal });
        if (!res.ok) throw new Error(`Error fetching competitors: ${res.status}`);
        const data: ApiCompetitor[] = await res.json();
        const mapped: Competitor[] = data.map((p) => ({
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

  /* -----------------------
     Inicializar weights & attempts
  ---------------------*/
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

  /* -----------------------
     Cuando cambia competencia -> cargar módulos/asignaciones/attempts
  ---------------------*/
  useEffect(() => {
    if (!selectedCompetitionId) {
      setCards([]);
      setOriginalAssignments({});
      return;
    }

    (async () => {
      try {
        const resp = await fetch(`${MODULES_API}?competition_id=${selectedCompetitionId}`);
        if (!resp.ok) {
          console.warn("GET /api/modules falló o no existe:", resp.status);
          setCards([]);
          setOriginalAssignments({});
          await loadAllAttemptsForCompetition(Number(selectedCompetitionId));
          return;
        }
        const modules = await resp.json();
        const newCards: Card[] = modules.map((m: any, idx: number) => ({
          tempId: `module_${m.id}`,
          moduleId: m.id ?? null,
          title: m.title ?? `Módulo ${idx + 1}`,
          assigned: [],
          passNumber: m.pass_number ?? 1,
          position: m.position ?? idx,
        }));
        setCards(newCards);

        const assignMap: Record<number, string[]> = {};
        await Promise.all(
          newCards.map(async (card) => {
            if (!card.moduleId) return;
            try {
              const r = await fetch(`${MODULES_API}/${card.moduleId}/assignments`);
              if (!r.ok) throw new Error("No assignments");
              const assigns = await r.json();
              const ids = assigns.map((a: any) => String(a.id_competidor));
              assignMap[card.moduleId] = ids;
              setCards((prev) => prev.map((c) => (c.moduleId === card.moduleId ? { ...c, assigned: ids } : c)));
            } catch (e) {
              console.warn("No pudo cargar assignments para módulo", card.moduleId);
              assignMap[card.moduleId] = [];
            }
          })
        );
        setOriginalAssignments(assignMap);
        await loadAllAttemptsForCompetition(Number(selectedCompetitionId));
      } catch (err: any) {
        console.warn(err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetitionId]);

  /* -----------------------
     Cargar attempts por competidor (por competencia)
  ---------------------*/
  async function loadAllAttemptsForCompetition(id_competencia: number) {
    const competitors = competitorsAll.filter((c) => c.id_competencia === String(id_competencia));
    await Promise.all(
      competitors.map(async (comp) => {
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
            rows.forEach((r: any) => {
              counts[r.exercise_id] = (counts[r.exercise_id] ?? 0) + 1;
            });
            (Object.keys(EXERCISE_NAME_TO_ID) as Exercise[]).forEach((ex) => {
              copy[comp.id][ex] = counts[EXERCISE_NAME_TO_ID[ex]] ?? 0;
            });
            return copy;
          });
        } catch {
          // ignore
        }
      })
    );
  }

  /* -----------------------
     Utilitarios UI
  ---------------------*/
  const selectedCompetition = competitions.find((c) => c.id === selectedCompetitionId) ?? null;
  const competitionConcluded = selectedCompetition ? new Date(selectedCompetition.endDate) < new Date() : false;

  const competitorsOfSelected = competitorsAll.filter((p) => p.id_competencia === selectedCompetitionId);
  const assignedIdsSet = new Set(cards.flatMap((c) => c.assigned));
  const availableCompetitors = competitorsOfSelected.filter((c) => !assignedIdsSet.has(c.id));
  const assignedCompetitors = cards.flatMap((card) => card.assigned.map((id) => ({ id, cardTitle: card.title })));
  const nameOf = (id?: string | null) => competitorsAll.find((x) => x.id === id)?.name ?? "—";

  /* -----------------------
     Attempts helpers
  ---------------------*/
  const getAttempts = (competitorId: string, exercise: Exercise) => attemptsDone[competitorId]?.[exercise] ?? 0;

  function computeAttemptRoundForCard(card: Card | undefined, exercise: Exercise) {
    if (!card || card.assigned.length === 0) return 1;
    const vals = card.assigned.map((id) => getAttempts(id, exercise));
    const min = Math.min(...vals);
    return Math.min(3, Math.max(1, 1 + min));
  }

  function findFirstParticipantNeedingAttempt(card: Card | undefined, exercise: Exercise) {
    if (!card) return null;
    for (let i = 0; i < card.assigned.length; i++) {
      const id = card.assigned[i];
      if (getAttempts(id, exercise) < 3) return i;
    }
    return null;
  }

  /* -----------------------
     Timer
  ---------------------*/
  useEffect(() => {
    setSecondsLeft(defaultSeconds);
  }, [defaultSeconds]);

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current ?? undefined);
            timerRef.current = null;
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000) as unknown as number;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  useEffect(() => {
    const card = cards.find((c) => c.tempId === activeCardId);
    if (card && card.assigned.length > 0) {
      const newRound = computeAttemptRoundForCard(card, currentExercise);
      setAttemptRound(newRound);
      const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
      if (idx != null) {
        setActiveParticipantIndex(idx);
        setActiveCompetitorId(card.assigned[idx]);
      } else {
        const nextExerciseIndex = EXERCISES.indexOf(currentExercise) + 1;
        if (nextExerciseIndex < EXERCISES.length) {
          setCurrentExercise(EXERCISES[nextExerciseIndex]);
        } else {
          setActiveCompetitorId(null);
          setActiveParticipantIndex(0);
        }
      }
    } else {
      setAttemptRound(1);
      setActiveParticipantIndex(0);
      setActiveCompetitorId(null);
    }
    setRunning(false);
    setSecondsLeft(defaultSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise, activeCardId, attemptsDone]);

  /* -----------------------
     CRUD helpers backend
  ---------------------*/
  async function createModuleOnServer(title = "Módulo", pass_number = 1) {
    if (!selectedCompetitionId) return null;
    try {
      const resp = await fetch(`${MODULES_API}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_competencia: Number(selectedCompetitionId), title, pass_number }),
      });
      if (!resp.ok) {
        console.warn("POST /api/modules falló:", resp.status);
        return null;
      }
      const json = await resp.json();
      return json.id as number;
    } catch (err) {
      console.error("createModule error", err);
      return null;
    }
  }

  async function patchModuleOnServer(moduleId: number, payload: { title?: string; pass_number?: number; position?: number }) {
    try {
      await fetch(`${MODULES_API}/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore
    }
  }

  /* -----------------------
     Acciones UI: crear / asignar / quitar
     —> ahora persistimos al asignar/quitar si moduleId existe
  ---------------------*/
  async function addCard() {
    if (selectedCompetitionId) {
      const moduleId = await createModuleOnServer(`Módulo ${cards.length + 1}`, 1);
      const temp = moduleId ? `module_${moduleId}` : uid("card_");
      setCards((prev) => [...prev, { tempId: temp, moduleId: moduleId ?? null, title: `Módulo ${prev.length + 1}`, assigned: [], passNumber: 1, position: prev.length }]);
      if (moduleId) setOriginalAssignments((o) => ({ ...o, [moduleId]: [] }));
    } else {
      setCards((prev) => [...prev, { tempId: uid("card_"), moduleId: null, title: `Módulo ${prev.length + 1}`, assigned: [], passNumber: 1, position: prev.length }]);
    }
  }

  async function removeCard(cardTempId: string) {
    const card = cards.find((c) => c.tempId === cardTempId);
    if (card?.moduleId) {
      try {
        await fetch(`${MODULES_API}/${card.moduleId}`, { method: "DELETE" });
      } catch {
        console.warn("DELETE /api/modules/:id falló (opcional)");
      }
      setOriginalAssignments((o) => {
        const copy = { ...o };
        delete copy[card.moduleId as number];
        return copy;
      });
    }
    setCards((prev) => prev.filter((c) => c.tempId !== cardTempId));
    if (activeCardId === cardTempId) {
      setActiveCardId(null);
      setActiveCompetitorId(null);
    }
  }

  // Asignar competidor al card (persistir si moduleId existe)
  async function assignCompetitorToCard(cardTempId: string, competitorId: string) {
    // actualizar UI primero
    setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, assigned: c.assigned.includes(competitorId) ? c.assigned : [...c.assigned, competitorId] } : c)));

    // persistir si moduleId existe
    const card = cards.find((c) => c.tempId === cardTempId);
    if (card?.moduleId) {
      try {
        const resp = await fetch(`${MODULES_API}/${card.moduleId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_competidor: Number(competitorId) }),
        });
        if (!resp.ok) {
          console.warn("assign failed", await resp.text());
        } else {
          // actualizar originalAssignments y recargar assignments oficiales
          const r2 = await fetch(`${MODULES_API}/${card.moduleId}/assignments`);
          if (r2.ok) {
            const assigns = await r2.json();
            const ids = assigns.map((a: any) => String(a.id_competidor));
            setCards((prev) => prev.map((c) => (c.moduleId === card.moduleId ? { ...c, assigned: ids } : c)));
            setOriginalAssignments((o) => ({ ...o, [card.moduleId as number]: ids }));
          }
        }
      } catch (err) {
        console.warn("Error assigning to module on server", err);
      }
    }
  }

  // Quitar competidor (persistir si moduleId existe)
  async function removeCompetitorFromCard(cardTempId: string, competitorId: string) {
    setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, assigned: c.assigned.filter((id) => id !== competitorId) } : c)));
    if (selectedForWeights === competitorId) setSelectedForWeights(null);
    if (activeCompetitorId === competitorId) {
      setActiveCompetitorId(null);
      setActiveCardId(null);
    }

    const card = cards.find((c) => c.tempId === cardTempId);
    if (card?.moduleId) {
      try {
        await fetch(`${MODULES_API}/${card.moduleId}/assign/${competitorId}`, { method: "DELETE" });
        // recargar assignments
        const r = await fetch(`${MODULES_API}/${card.moduleId}/assignments`);
        if (r.ok) {
          const assigns = await r.json();
          const ids = assigns.map((a: any) => String(a.id_competidor));
          setCards((prev) => prev.map((c) => (c.moduleId === card.moduleId ? { ...c, assigned: ids } : c)));
          setOriginalAssignments((o) => ({ ...o, [card.moduleId as number]: ids }));
        } else {
          // actualizar original local
          setOriginalAssignments((o) => ({ ...o, [card.moduleId as number]: (o[card.moduleId as number] ?? []).filter((id) => id !== competitorId) }));
        }
      } catch (err) {
        console.warn("Error removing assignment", err);
      }
    }
  }

  function setPassNumber(cardTempId: string, n: number) {
    setCards((prev) => prev.map((c) => (c.tempId === cardTempId ? { ...c, passNumber: Math.max(1, n) } : c)));
  }

  function setWeightForAttempt(competitorId: string, exercise: Exercise, attemptIndex: number, value: number | null) {
    setWeights((prev) => ({
      ...prev,
      [competitorId]: {
        ...prev[competitorId],
        [exercise]: prev[competitorId][exercise].map((v, i) => (i === attemptIndex ? value : v)),
      },
    }));
  }

  /* onBlur persist individual */
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
          module_id: (() => {
            const card = cards.find((c) => c.assigned.includes(id_competidor));
            return card?.moduleId ?? null;
          })(),
        }),
      });
      if (!resp.ok) {
        console.warn("Error saving weight:", await resp.text());
      } else {
        setAttemptsDone((prev) => {
          const cur = prev[id_competidor] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
          const prevSlot = (weights[id_competidor]?.[exercise]?.[attemptIndex] ?? null);
          const increment = prevSlot == null && value != null ? 1 : 0;
          return { ...prev, [id_competidor]: { ...cur, [exercise]: Math.min(3, (cur[exercise] ?? 0) + increment) } };
        });
      }
    } catch (err) {
      console.error("saveWeightToServer error", err);
    }
  }

  function handleAttemptInputBlur(competitorId: string, exercise: Exercise, attemptIndex: number) {
    const val = weights[competitorId]?.[exercise]?.[attemptIndex] ?? null;
    saveWeightToServer(competitorId, exercise, attemptIndex, val);
  }

  /* -----------------------
     Seleccionar competidor manualmente
  ---------------------*/
  function selectCompetitorToCompete(cardTempId: string, competitorId: string) {
    const card = cards.find((c) => c.tempId === cardTempId);
    if (!card) return;
    const idx = card.assigned.indexOf(competitorId);
    if (idx < 0) return;
    setActiveCardId(cardTempId);
    setActiveCompetitorId(competitorId);
    setActiveParticipantIndex(idx);

    const newRound = computeAttemptRoundForCard(card, currentExercise);
    setAttemptRound(newRound);

    setSecondsLeft(defaultSeconds);
    setRunning(false);
  }

  function selectCompetitorForWeights(competitorId: string | null) {
    setSelectedForWeights(competitorId);
  }

  /* -----------------------
     Iniciar bloque: ahora consultamos endpoint /:id/next si moduleId existe
  ---------------------*/
  async function startBlock(cardTempId: string) {
    const card = cards.find((c) => c.tempId === cardTempId);
    if (!card || card.assigned.length === 0) return alert("El card no tiene participantes asignados");
    setActiveCardId(cardTempId);

    // Si moduleId existe, preguntamos al servidor por el siguiente participante (mejor fuente de verdad)
    if (card.moduleId) {
      try {
        const exercise_id = EXERCISE_NAME_TO_ID[currentExercise];
        const r = await fetch(`${MODULES_API}/${card.moduleId}/next?exercise_id=${exercise_id}`);
        if (r.ok) {
          const json = await r.json();
          const next = json?.next ?? null;
          if (next && next.id_competidor != null) {
            const idStr = String(next.id_competidor);
            const idx = card.assigned.indexOf(idStr);
            if (idx >= 0) {
              setActiveParticipantIndex(idx);
              setActiveCompetitorId(idStr);
            } else {
              // si el servidor devolvió un competidor no en la lista (raro), fallback al primer participante que necesita intento
              const idx2 = findFirstParticipantNeedingAttempt(card, currentExercise);
              if (idx2 != null) {
                setActiveParticipantIndex(idx2);
                setActiveCompetitorId(card.assigned[idx2]);
              } else {
                setActiveParticipantIndex(0);
                setActiveCompetitorId(card.assigned[0]);
              }
            }
          } else {
            // server returned null -> fallback local
            const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
            if (idx != null) {
              setActiveParticipantIndex(idx);
              setActiveCompetitorId(card.assigned[idx]);
            } else {
              setActiveParticipantIndex(0);
              setActiveCompetitorId(card.assigned[0]);
            }
          }
        } else {
          // fallback local if endpoint missing
          const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
          if (idx != null) {
            setActiveParticipantIndex(idx);
            setActiveCompetitorId(card.assigned[idx]);
          } else {
            setActiveParticipantIndex(0);
            setActiveCompetitorId(card.assigned[0]);
          }
        }
      } catch (err) {
        console.warn("Error fetching next participant:", err);
        const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
        if (idx != null) {
          setActiveParticipantIndex(idx);
          setActiveCompetitorId(card.assigned[idx]);
        } else {
          setActiveParticipantIndex(0);
          setActiveCompetitorId(card.assigned[0]);
        }
      }
    } else {
      // no moduleId -> comportamiento local
      const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
      if (idx != null) {
        setActiveParticipantIndex(idx);
        setActiveCompetitorId(card.assigned[idx]);
      } else {
        setActiveParticipantIndex(0);
        setActiveCompetitorId(card.assigned[0]);
      }
    }

    const newRound = computeAttemptRoundForCard(card, currentExercise);
    setAttemptRound(newRound);
    setSecondsLeft(defaultSeconds);
    setRunning(false);

    // opcional: iniciar run en server si existe endpoint
    if (card.moduleId) {
      fetch(`${MODULES_API}/${card.moduleId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_competencia: Number(selectedCompetitionId) }),
      }).catch(() => {});
    }
  }

  /* -----------------------
     Avanzar flujo (siguiente participante)
  ---------------------*/
  function snapshotDefaultFor(id: string) {
    const cur = attemptsDone[id] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
    return cur;
  }

  function goToNextParticipantOrRound() {
    if (!activeCardId || !activeCompetitorId) return;
    const card = cards.find((c) => c.tempId === activeCardId);
    if (!card) return;

    setAttemptsDone((prev) => {
      const current = prev[activeCompetitorId] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
      const curVal = current[currentExercise] ?? 0;
      if (curVal >= 3) return prev;
      return { ...prev, [activeCompetitorId]: { ...current, [currentExercise]: curVal + 1 } };
    });

    const snapshot: Record<string, Record<Exercise, number>> = {};
    Object.keys(attemptsDone).forEach((k) => (snapshot[k] = { ...attemptsDone[k] } as any));
    const cur = snapshotDefaultFor(activeCompetitorId);
    snapshot[activeCompetitorId] = { ...cur, [currentExercise]: Math.min(3, (cur[currentExercise] ?? 0) + 1) };

    const getSnapAttempts = (competitorId: string) => snapshot[competitorId]?.[currentExercise] ?? 0;
    const total = card.assigned.length;
    let foundIdx: number | null = null;
    for (let i = activeParticipantIndex + 1; i < total; i++) {
      if (getSnapAttempts(card.assigned[i]) < 3) { foundIdx = i; break; }
    }
    if (foundIdx == null) {
      for (let i = 0; i <= activeParticipantIndex; i++) {
        if (getSnapAttempts(card.assigned[i]) < 3) { foundIdx = i; break; }
      }
    }

    if (foundIdx != null) {
      setActiveParticipantIndex(foundIdx);
      setActiveCompetitorId(card.assigned[foundIdx]);
      setSecondsLeft(defaultSeconds);
      setRunning(false);
      const vals = card.assigned.map((id) => snapshot[id]?.[currentExercise] ?? 0);
      const min = Math.min(...vals);
      setAttemptRound(Math.min(3, Math.max(1, 1 + min)));
      return;
    }

    const valsAfter = card.assigned.map((id) => snapshot[id]?.[currentExercise] ?? 0);
    const minAfter = Math.min(...valsAfter);
    if (minAfter < 3) {
      const newRound = Math.min(3, 1 + minAfter);
      setAttemptRound(newRound);
      const firstIdx = card.assigned.findIndex((id) => snapshot[id]?.[currentExercise] < 3);
      if (firstIdx >= 0) {
        setActiveParticipantIndex(firstIdx);
        setActiveCompetitorId(card.assigned[firstIdx]);
        setSecondsLeft(defaultSeconds);
        setRunning(false);
        return;
      }
    }

    const nextExerciseIndex = EXERCISES.indexOf(currentExercise) + 1;
    if (nextExerciseIndex < EXERCISES.length) {
      setCurrentExercise(EXERCISES[nextExerciseIndex]);
      return;
    }

    alert("Bloque completado: todos los ejercicios e intentos terminados.");
    setActiveCardId(null);
    setActiveCompetitorId(null);
    setRunning(false);
  }

  function handleNextFromBottom() {
    setRunning(false);
    goToNextParticipantOrRound();
  }

  function handleStart() {
    if (!activeCompetitorId) return alert("Selecciona primero un competidor para competir");
    if (secondsLeft <= 0) setSecondsLeft(defaultSeconds);
    setRunning(true);
  }
  function handlePause() {
    setRunning(false);
  }
  function handleResetTimer() {
    setRunning(false);
    setSecondsLeft(defaultSeconds);
  }

  useEffect(() => {
    setSecondsLeft(defaultSeconds);
    setRunning(false);
  }, [activeCompetitorId, defaultSeconds]);

  /* -----------------------
     Guardar TODO: módulos/asignaciones/pesos (botón)
  ---------------------*/
  async function saveAllToServer() {
    if (!selectedCompetitionId) {
      alert("Selecciona una competencia antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      const updatedCards = [...cards];
      for (let i = 0; i < updatedCards.length; i++) {
        const c = updatedCards[i];
        if (!c.moduleId) {
          const createdId = await createModuleOnServer(c.title, c.passNumber);
          if (createdId) {
            c.moduleId = createdId;
            c.tempId = `module_${createdId}`;
            setOriginalAssignments((o) => ({ ...o, [createdId]: [] }));
          }
        } else {
          await patchModuleOnServer(c.moduleId, { title: c.title, pass_number: c.passNumber, position: c.position ?? i });
        }
      }
      setCards(updatedCards);

      for (const card of updatedCards) {
        if (!card.moduleId) continue;
        const mid = card.moduleId;
        const serverList = originalAssignments[mid] ?? [];
        const localList = card.assigned;
        const toAdd = localList.filter((id) => !serverList.includes(id));
        const toRemove = serverList.filter((id) => !localList.includes(id));

        await Promise.all(toRemove.map(async (competitorId) => {
          try { await fetch(`${MODULES_API}/${mid}/assign/${competitorId}`, { method: "DELETE" }); } catch {}
        }));

        for (const competitorId of toAdd) {
          try {
            await fetch(`${MODULES_API}/${mid}/assign`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_competidor: Number(competitorId) }),
            });
          } catch {}
        }

        try {
          const r = await fetch(`${MODULES_API}/${mid}/assignments`);
          if (r.ok) {
            const assigns = await r.json();
            const ids = assigns.map((a: any) => String(a.id_competidor));
            setCards((prev) => prev.map((c) => (c.moduleId === mid ? { ...c, assigned: ids } : c)));
            setOriginalAssignments((o) => ({ ...o, [mid]: ids }));
          } else {
            setOriginalAssignments((o) => ({ ...o, [mid]: [...localList] }));
          }
        } catch {
          setOriginalAssignments((o) => ({ ...o, [mid]: [...localList] }));
        }
      }

      // Guardar pesos
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
                  body: JSON.stringify({
                    id_competencia: Number(selectedCompetitionId),
                    id_competidor: Number(competitorId),
                    exercise_id: EXERCISE_NAME_TO_ID[ex],
                    attempt_number: i + 1,
                    weight_kg: val,
                    module_id: (() => {
                      const card = cards.find((c) => c.assigned.includes(competitorId));
                      return card?.moduleId ?? null;
                    })(),
                  }),
                });
              } catch {}
            }
          }
        }
      }

      await loadAllAttemptsForCompetition(Number(selectedCompetitionId));
      alert("Guardado completado.");
    } catch (err) {
      console.error("saveAllToServer error", err);
      alert("Ocurrió un error al guardar. Revisa la consola.");
    } finally {
      setSaving(false);
    }
  }

  /* -----------------------
     Render
  ---------------------*/
  const formatDate = (iso?: string | null) =>
    !iso ? "—" : new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestión de Competencia</h2>

      <div className={styles.controlsRow}>
        <label className={styles.label}>Seleccionar competencia:</label>

        <select className={styles.select} value={selectedCompetitionId ?? ""} onChange={(e) => setSelectedCompetitionId(e.target.value || null)} disabled={loadingCompetitions}>
          {loadingCompetitions && <option value="">Cargando competencias...</option>}
          {!loadingCompetitions && competitions.length === 0 && <option value="">Sin competencias</option>}
          {competitions.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>

        {loadingCompetitors && <div className={styles.hint}>Cargando competidores...</div>}
        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className={styles.addBtn} onClick={() => addCard()} disabled={!selectedCompetitionId}>+ Añadir card</button>
          <button className={styles.primaryBtn} onClick={saveAllToServer} disabled={saving || !selectedCompetitionId}>{saving ? "Guardando..." : "Guardar cambios"}</button>
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
            {selectedCompetition.eventDate && <div style={{ color: "var(--muted)", fontSize: 13 }}>Evento: <strong>{formatDate(selectedCompetition.eventDate)}</strong></div>}
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
                      <input type="number" min={1} value={card.passNumber} onChange={(e) => setPassNumber(card.tempId, Math.max(1, Number(e.target.value || 1)))} className={styles.smallNumber} />
                      <button className={styles.smallBtn} onClick={() => removeCard(card.tempId)}>Eliminar</button>
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
