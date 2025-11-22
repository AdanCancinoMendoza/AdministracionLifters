// src/components/CompetitionManager.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/AdminOrdenYPesos.module.css";

/* -----------------------
  Tipos de la app
------------------------*/
type Exercise = "Press banca" | "Peso muerto" | "Sentadilla";
const EXERCISES: Exercise[] = ["Press banca", "Peso muerto", "Sentadilla"];

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

/* Tipos de respuesta API (solo para referencia) */
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

/* -----------------------
  Config
------------------------*/
const API_BASE = "http://localhost:3001";
const COMPETITIONS_API = `${API_BASE}/api/competenciasadmin`;
const COMPETITORS_API = `${API_BASE}/api/competidor`;

/* -----------------------
  Componente
------------------------*/
export default function CompetitionManager(): JSX.Element {
  /* --- datos remotos --- */
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitorsAll, setCompetitorsAll] = useState<Competitor[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --- UI / selección --- */
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);

  /* --- cards y asignaciones --- */
  type Card = { id: string; title: string; assigned: string[]; passNumber: number };
  const uid = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;
  const [cards, setCards] = useState<Card[]>([{ id: uid("card_"), title: "Módulo A", assigned: [], passNumber: 1 }]);

  /* --- pesos --- */
  const [weights, setWeights] = useState<Record<string, Record<Exercise, (number | null)[]>>>({});

  /* --- intentos por competidor por ejercicio (0..3) --- */
  const [attemptsDone, setAttemptsDone] = useState<Record<string, Record<Exercise, number>>>({});

  /* --- timer & flujo --- */
  const [defaultSeconds, setDefaultSeconds] = useState<number>(60);
  const [currentExercise, setCurrentExercise] = useState<Exercise>(EXERCISES[0]);
  const [attemptRound, setAttemptRound] = useState<number>(1); // representacional (1..3) calculado

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeCompetitorId, setActiveCompetitorId] = useState<string | null>(null);
  const [activeParticipantIndex, setActiveParticipantIndex] = useState<number>(0);

  const [secondsLeft, setSecondsLeft] = useState<number>(defaultSeconds);
  const [running, setRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  /* selección para editar pesos */
  const [selectedForWeights, setSelectedForWeights] = useState<string | null>(null);

  /* -----------------------
     Fetch: competencias
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
     Fetch: competidores
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
     Inicializar weights & attempts cuando cambian competidores
  ---------------------*/
  useEffect(() => {
    setWeights((prev) => {
      const copy = { ...prev };
      competitorsAll.forEach((c) => {
        if (!copy[c.id]) {
          copy[c.id] = {
            "Press banca": [null, null, null],
            "Peso muerto": [null, null, null],
            "Sentadilla": [null, null, null],
          };
        }
      });
      return copy;
    });

    setAttemptsDone((prev) => {
      const copy: Record<string, Record<Exercise, number>> = { ...prev };
      competitorsAll.forEach((c) => {
        if (!copy[c.id]) {
          copy[c.id] = { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
        }
      });
      return copy;
    });
  }, [competitorsAll]);

  /* -----------------------
     Utilitarios de UI / datos filtrados
  ---------------------*/
  const selectedCompetition = competitions.find((c) => c.id === selectedCompetitionId) ?? null;
  const competitionConcluded = selectedCompetition ? new Date(selectedCompetition.endDate) < new Date() : false;

  // todos los competidores de la competencia seleccionada
  const competitorsOfSelected = competitorsAll.filter((p) => p.id_competencia === selectedCompetitionId);

  // set con ids asignados a cards
  const assignedIdsSet = new Set(cards.flatMap((c) => c.assigned));

  // disponibles = competidores de la competencia que no están asignados a ningún card
  const availableCompetitors = competitorsOfSelected.filter((c) => !assignedIdsSet.has(c.id));

  // lista de asignados con el card al que pertenecen (para mostrar en la UI)
  const assignedCompetitors = cards.flatMap((card) => card.assigned.map((id) => ({ id, cardTitle: card.title })));

  const nameOf = (id?: string | null) => competitorsAll.find((x) => x.id === id)?.name ?? "—";

  /* -----------------------
     Helpers para attempts logic
  ---------------------*/
  const getAttempts = (competitorId: string, exercise: Exercise) => attemptsDone[competitorId]?.[exercise] ?? 0;

  function computeAttemptRoundForCard(card: Card | undefined, exercise: Exercise) {
    if (!card || card.assigned.length === 0) return 1;
    const vals = card.assigned.map((id) => getAttempts(id, exercise));
    const min = Math.min(...vals);
    // round = 1 + minCompleted, clamp 1..3
    const r = Math.min(3, Math.max(1, 1 + min));
    return r;
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
     Timer: efectos y controles
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

  /* -----------------------
     Cuando cambia ejercicio (manual o automático) -> calcular ronda y participante según attemptsDone
  ---------------------*/
  useEffect(() => {
    const card = cards.find((c) => c.id === activeCardId);
    if (card && card.assigned.length > 0) {
      const newRound = computeAttemptRoundForCard(card, currentExercise);
      setAttemptRound(newRound);

      const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
      if (idx != null) {
        setActiveParticipantIndex(idx);
        setActiveCompetitorId(card.assigned[idx]);
      } else {
        // todos terminaron este ejercicio -> si hay siguiente ejercicio, saltar a él automáticamente
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
     CRUD y lógica
  ---------------------*/
  function addCard() {
    setCards((prev) => [...prev, { id: uid("card_"), title: `Módulo ${String.fromCharCode(65 + prev.length)}`, assigned: [], passNumber: 1 }]);
  }
  function removeCard(cardId: string) {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (activeCardId === cardId) {
      setActiveCardId(null);
      setActiveCompetitorId(null);
    }
  }
  function assignCompetitorToCard(cardId: string, competitorId: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, assigned: c.assigned.includes(competitorId) ? c.assigned : [...c.assigned, competitorId] } : c))
    );
  }
  function removeCompetitorFromCard(cardId: string, competitorId: string) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, assigned: c.assigned.filter((id) => id !== competitorId) } : c)));
    if (selectedForWeights === competitorId) setSelectedForWeights(null);
    if (activeCompetitorId === competitorId) {
      setActiveCompetitorId(null);
      setActiveCardId(null);
    }
  }
  function setPassNumber(cardId: string, n: number) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, passNumber: Math.max(1, n) } : c)));
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

  function selectCompetitorToCompete(cardId: string, competitorId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const idx = card.assigned.indexOf(competitorId);
    if (idx < 0) return;
    setActiveCardId(cardId);
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

  function startBlock(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.assigned.length === 0) return alert("El card no tiene participantes asignados");
    setActiveCardId(cardId);

    const idx = findFirstParticipantNeedingAttempt(card, currentExercise);
    if (idx != null) {
      setActiveParticipantIndex(idx);
      setActiveCompetitorId(card.assigned[idx]);
    } else {
      setActiveParticipantIndex(0);
      setActiveCompetitorId(card.assigned[0]);
    }

    const newRound = computeAttemptRoundForCard(card, currentExercise);
    setAttemptRound(newRound);

    setSecondsLeft(defaultSeconds);
    setRunning(false);
  }

  /* -----------------------
     Avanzar según lógica mejorada:
  ---------------------*/
  function goToNextParticipantOrRound() {
    if (!activeCardId || !activeCompetitorId) return;
    const card = cards.find((c) => c.id === activeCardId);
    if (!card) return;

    setAttemptsDone((prev) => {
      const current = prev[activeCompetitorId] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
      const curVal = current[currentExercise] ?? 0;
      if (curVal >= 3) return prev;
      const copy = { ...prev, [activeCompetitorId]: { ...current, [currentExercise]: curVal + 1 } };
      return copy;
    });

    const snapshot = (() => {
      const copy: Record<string, Record<Exercise, number>> = {};
      Object.keys(attemptsDone).forEach((k) => (copy[k] = { ...attemptsDone[k] }));
      const cur = copy[activeCompetitorId] ?? { "Press banca": 0, "Peso muerto": 0, "Sentadilla": 0 };
      copy[activeCompetitorId] = { ...cur, [currentExercise]: Math.min(3, (cur[currentExercise] ?? 0) + 1) };
      return copy;
    })();

    const getSnapAttempts = (competitorId: string) => snapshot[competitorId]?.[currentExercise] ?? 0;

    const total = card.assigned.length;
    let foundIdx: number | null = null;
    for (let i = activeParticipantIndex + 1; i < total; i++) {
      if (getSnapAttempts(card.assigned[i]) < 3) {
        foundIdx = i;
        break;
      }
    }
    if (foundIdx == null) {
      for (let i = 0; i <= activeParticipantIndex; i++) {
        if (getSnapAttempts(card.assigned[i]) < 3) {
          foundIdx = i;
          break;
        }
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
      const nextEx = EXERCISES[nextExerciseIndex];
      setCurrentExercise(nextEx);
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
     Helpers visuales: formateo fechas
  ---------------------*/
  const formatDate = (iso?: string | null) =>
    !iso ? "—" : new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

  /* -----------------------
     Render
  ---------------------*/
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestión de Competencia</h2>

      <div className={styles.controlsRow}>
        <label className={styles.label}>Seleccionar competencia:</label>

        <select
          className={styles.select}
          value={selectedCompetitionId ?? ""}
          onChange={(e) => setSelectedCompetitionId(e.target.value || null)}
          disabled={loadingCompetitions}
        >
          {loadingCompetitions && <option value="">Cargando competencias...</option>}
          {!loadingCompetitions && competitions.length === 0 && <option value="">Sin competencias</option>}
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {loadingCompetitors && <div className={styles.hint}>Cargando competidores...</div>}
        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
      </div>

      {/* Vista previa: imagen + fechas (si hay competencia seleccionada) */}
      {selectedCompetition ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 140, height: 90, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "#f3f6ff" }}>
            {selectedCompetition.imageUrl ? (
              <img src={selectedCompetition.imageUrl} alt={selectedCompetition.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#7b8794" }}>
                Sin imagen
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 800 }}>{selectedCompetition.name}</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Inicio: <strong>{formatDate(selectedCompetition.startDate)}</strong>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Cierre: <strong>{formatDate(selectedCompetition.endDate)}</strong>
            </div>
            {selectedCompetition.eventDate && (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Evento: <strong>{formatDate(selectedCompetition.eventDate)}</strong>
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              {competitionConcluded ? (
                <span className={styles.concluded}>Competencia ya concluida</span>
              ) : (
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Competencia activa / próxima</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.hint}>Selecciona una competencia para ver sus datos</div>
      )}

      {/* Mensaje de carga o error */}
      {loadingCompetitions || loadingCompetitors ? (
        <div className={styles.hint}>Cargando datos...</div>
      ) : error ? (
        <div style={{ color: "var(--danger)" }}>{error}</div>
      ) : (
        <div className={styles.mainGrid}>
          {/* LEFT: Cards */}
          <div className={styles.leftCol}>
            <div className={styles.sectionHeader}>
              <h3>Cards / Módulos</h3>
              <button className={styles.addBtn} onClick={addCard}>
                + Añadir card
              </button>
            </div>

            <div className={styles.cardsList}>
              {cards.map((card) => (
                <div key={card.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <input
                      className={styles.cardTitle}
                      value={card.title}
                      onChange={(e) => setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, title: e.target.value } : c)))}
                    />
                    <div className={styles.cardActions}>
                      <label>Pasarán:</label>
                      <input
                        type="number"
                        min={1}
                        value={card.passNumber}
                        onChange={(e) => setPassNumber(card.id, Math.max(1, Number(e.target.value || 1)))}
                        className={styles.smallNumber}
                      />
                      <button className={styles.smallBtn} onClick={() => removeCard(card.id)}>
                        Eliminar
                      </button>
                      <button className={styles.primaryBtn} onClick={() => startBlock(card.id)}>
                        Iniciar bloque
                      </button>
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
                              <div className={styles.assignedMeta}>
                                ID: {id} — Peso: <strong>{competitor?.peso ?? "—"} kg</strong> • Cat: <strong>{competitor?.categoria ?? "—"}</strong>
                              </div>
                            </div>

                            <div className={styles.assignedBtns}>
                              <button className={styles.tinyBtn} onClick={() => selectCompetitorForWeights(id)}>
                                Pesos
                              </button>
                              <button className={styles.tinyBtn} onClick={() => selectCompetitorToCompete(card.id, id)} title="Seleccionar para competir">
                                Seleccionar
                              </button>
                              <button className={styles.tinyBtn} onClick={() => removeCompetitorFromCard(card.id, id)}>
                                Quitar
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {card.assigned.length === 0 && <div className={styles.hint}>No hay competidores asignados</div>}
                    </div>

                    <div className={styles.assignRow}>
                      <select
                        value={""}
                        onChange={(e) => {
                          if (e.target.value) {
                            assignCompetitorToCard(card.id, e.target.value);
                            e.currentTarget.value = "";
                          }
                        }}
                        className={styles.addSelect}
                      >
                        <option value="">Agregar competidor...</option>
                        {availableCompetitors.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.peso ?? "—"}kg — {p.categoria ?? "—"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: competidores disponibles, asignados y tabla de pesos y timer */}
          <div className={styles.rightCol}>
            <h3>Competidores disponibles en "{selectedCompetition?.name ?? "—"}"</h3>

            <ul className={styles.availableList}>
              {availableCompetitors.map((p) => (
                <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      Peso: <strong>{p.peso ?? "—"} kg</strong> • Categoría: <strong>{p.categoria ?? "—"}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Disponible</div>
                </li>
              ))}
              {availableCompetitors.length === 0 && <li className={styles.hint}>No hay competidores disponibles (todos asignados o sin inscritos)</li>}
            </ul>

            {/* sección pequeña que muestra asignados por módulo */}
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: "8px 0" }}>Asignados a módulos</h4>
              {assignedCompetitors.length > 0 ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {assignedCompetitors.map((a) => (
                    <li key={a.id} style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0" }}>
                      {nameOf(a.id)} <span style={{ fontWeight: 700 }}>— {a.cardTitle}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.hint}>No hay competidores asignados todavía</div>
              )}
            </div>

            <div className={styles.weightsPanel} style={{ marginTop: 16 }}>
              <h3>Tabla de Pesos</h3>
              {selectedForWeights ? (
                <div className={styles.weightCard}>
                  <div className={styles.weightHeader}>
                    <strong>{nameOf(selectedForWeights)}</strong>
                    <button className={styles.smallBtn} onClick={() => setSelectedForWeights(null)}>
                      Cerrar
                    </button>
                  </div>

                  {EXERCISES.map((ex) => (
                    <div key={ex} className={styles.exerciseRow}>
                      <div className={styles.exerciseLabel}>{ex}</div>
                      <div className={styles.attemptsRow}>
                        {weights[selectedForWeights!]?.[ex].map((val, i) => (
                          <input
                            key={i}
                            type="number"
                            placeholder={`Intento ${i + 1}`}
                            value={val ?? ""}
                            onChange={(e) => setWeightForAttempt(selectedForWeights!, ex, i, e.target.value === "" ? null : Number(e.target.value))}
                            className={styles.attemptInput}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                        Intentos completados: <strong>{attemptsDone[selectedForWeights!]?.[ex] ?? 0}</strong> / 3
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.hint}>Selecciona un competidor (Pesos) para editar sus intentos</div>
              )}
            </div>

            <div className={styles.timerSetup}>
              <label>Segundos por participante:</label>
              <input type="number" min={10} value={defaultSeconds} onChange={(e) => setDefaultSeconds(Math.max(10, Number(e.target.value || 60)))} className={styles.smallNumber} />

              <div className={styles.exerciseSelector}>
                <label>Ejercicio actual:</label>
                <select value={currentExercise} onChange={(e) => setCurrentExercise(e.target.value as Exercise)}>
                  {EXERCISES.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.blockStatus}>
                <div>Card activo: {activeCardId ? cards.find((c) => c.id === activeCardId)?.title : "—"}</div>
                <div>Intento (ronda): {attemptRound} / 3</div>
                <div>
                  Participante activo: {activeCompetitorId ? nameOf(activeCompetitorId) : "—"} {activeCompetitorId && <span className={styles.activeMeta}>(index {activeParticipantIndex + 1})</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer} />

      {/* barra inferior */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          <div className={styles.activeName}>{activeCompetitorId ? nameOf(activeCompetitorId) : "Sin competidor seleccionado"}</div>
          <div className={styles.activeMetaSmall}>
            {activeCardId ? cards.find((c) => c.id === activeCardId)?.title : ""} • {currentExercise} • Intento {attemptRound}/3
          </div>
        </div>

        <div className={styles.bottomCenter}>
          <div className={styles.timerDisplay}>{secondsLeft}s</div>
        </div>

        <div className={styles.bottomRight}>
          <button className={styles.smallBtn} onClick={handleStart} title="Iniciar">
            ▶︎
          </button>
          <button className={styles.smallBtn} onClick={handlePause} title="Pausar">
            ⏸
          </button>
          <button className={styles.smallBtn} onClick={handleResetTimer} title="Reiniciar">
            ⟲
          </button>
          <button className={styles.primaryBtn} onClick={handleNextFromBottom} title="Siguiente participante / intento">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
