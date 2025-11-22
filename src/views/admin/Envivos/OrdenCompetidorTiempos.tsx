// OrdenCompetidorTiemposWithModals.tsx
import React, { useEffect, useRef, useState } from "react";
import styles from "../../../styles/AdminOrdenYPesos.module.css";
import {
  FiPlus,
  FiTrash2,
  FiEdit,
  FiPlay,
  FiPause,
  FiSkipForward,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

/* ------------------ TIPOS ------------------ */
type Competencia = { id_competencia: number; nombre: string };
type Competidor = {
  id_competidor: number;
  nombre: string;
  apellidos: string;
  peso: string | number;
  edad: number;
  categoria?: string;
  id_competencia?: number;
};

type SectionEntry = {
  id_competidor: number;
  orden: number; // orden dentro de la sección
  perExercise: Record<number, { 1: string; 2: string; 3: string }>; // ejId -> intento -> peso
  currentExerciseIdx: number; // index into EJERCICIOS array (0..N-1)
  currentAttempt: number; // 1..3
  estado?: string; // 'expirado'|'skip'|'finished'
};

type Section = {
  id: string;
  name: string;
  entries: SectionEntry[];
};

type QueueItem = {
  sectionId: string;
  entryIndex: number; // index inside section.entries
  id_competidor: number;
  ejercicioId: number;
  ejercicioNombre: string;
  intento: number;
  tiempo_por_ejercicio: number;
};

/* ------------------ EJERCICIOS Y DATOS DE EJEMPLO ------------------ */
const EJERCICIOS = [
  { id: 1, nombre: "Press Banca" },
  { id: 2, nombre: "Sentadilla" },
  { id: 3, nombre: "Peso Muerto" },
];

const SAMPLE_COMPETENCIAS: Competencia[] = [
  { id_competencia: 1, nombre: "Abierta Puebla 2025" },
  { id_competencia: 2, nombre: "Regional Centro 2025" },
];

const SAMPLE_COMPETIDORES: Competidor[] = [
  {
    id_competidor: 101,
    nombre: "Luis",
    apellidos: "Gómez",
    peso: 82,
    edad: 28,
    categoria: "Ligero",
    id_competencia: 1,
  },
  {
    id_competidor: 102,
    nombre: "María",
    apellidos: "Pérez",
    peso: 63,
    edad: 24,
    categoria: "Ligero",
    id_competencia: 1,
  },
  {
    id_competidor: 103,
    nombre: "Jorge",
    apellidos: "López",
    peso: 95,
    edad: 30,
    categoria: "Mediano",
    id_competencia: 1,
  },
  {
    id_competidor: 104,
    nombre: "Ana",
    apellidos: "Ruiz",
    peso: 70,
    edad: 26,
    categoria: "Mediano",
    id_competencia: 1,
  },
];

/* ------------------ COMPONENTE ------------------ */
export default function OrdenCompetidorTiemposWithModals() {
  // datos / selección competencia
  const [competencias] = useState<Competencia[]>(SAMPLE_COMPETENCIAS);
  const [selectedCompetencia, setSelectedCompetencia] = useState<number | null>(
    1
  );
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [loading, setLoading] = useState(false);

  // secciones (categorías) y entries
  const [sections, setSections] = useState<Section[]>([]);

  // Modales: agregar sección (categoria), editar competidor entry
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [addSectionName, setAddSectionName] = useState("");
  const [addSectionLimit, setAddSectionLimit] = useState<number | "">("");
  const [addSectionSelectedIds, setAddSectionSelectedIds] = useState<
    Set<number>
  >(new Set());

  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(
    null
  );

  // selección de tarjeta/competidor para ver detalles (derecha)
  const [selectedCard, setSelectedCard] = useState<{
    sectionId: string;
    entryIndex: number;
  } | null>(null);

  // temporizador / queue
  const timerIntervalRef = useRef<number | null>(null);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number | null>(null); // índice en queue
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // ----------------------------------------------------
  // CARGA SIMULADA DE COMPETIDORES según competencia seleccionada
  useEffect(() => {
    if (!selectedCompetencia) {
      setCompetidores([]);
      setSections([]);
      return;
    }
    setLoading(true);
    const comps = SAMPLE_COMPETIDORES.filter(
      (c) => c.id_competencia === selectedCompetencia
    );
    setCompetidores(comps);

    // si no hay secciones, crear dos de ejemplo (ligero/mediano) agrupando por categoria
    const byCat = new Map<string, number[]>();
    comps.forEach((c) => {
      const cat = c.categoria ?? "Sin categoría";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(c.id_competidor);
    });
    const autoSections: Section[] = [];
    let idx = 0;
    for (const [cat, ids] of byCat.entries()) {
      idx++;
      autoSections.push({
        id: `${cat.toLowerCase().replace(/\s+/g, "_")}_${idx}`,
        name: cat,
        entries: ids.map((id, i) => ({
          id_competidor: id,
          orden: i + 1,
          perExercise: generateDefaultPerExercise(),
          currentExerciseIdx: 0,
          currentAttempt: 1,
        })),
      });
    }
    setSections(autoSections);
    setLoading(false);
    // cleanup timer when changing competition
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setActiveQueueIndex(null);
      setRemaining(null);
      setIsRunning(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetencia]);

  function generateDefaultPerExercise() {
    const o: Record<number, { 1: string; 2: string; 3: string }> = {};
    for (const ej of EJERCICIOS) {
      o[ej.id] = { 1: "100", 2: "105", 3: "110" }; // valores por defecto — los que mostraste
    }
    return o;
  }

  /* -------------------- MODAL: AÑADIR SECCIÓN (CATEGORÍA) -------------------- */
  function openAddSectionModal() {
    setAddSectionName("");
    setAddSectionLimit("");
    setAddSectionSelectedIds(new Set());
    setShowAddSectionModal(true);
  }
  function toggleSelectForAdd(id: number) {
    setAddSectionSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else {
        // enforce limit if set
        if (typeof addSectionLimit === "number" && copy.size >= addSectionLimit) {
          // no permitir más
        } else copy.add(id);
      }
      return copy;
    });
  }
  function confirmAddSection() {
    if (!addSectionName.trim()) {
      alert("Pon un nombre para la categoría");
      return;
    }
    const selected = Array.from(addSectionSelectedIds);
    if (selected.length === 0) {
      alert("Selecciona al menos un competidor para agregar");
      return;
    }
    const newSection: Section = {
      id:
        addSectionName
          .toLowerCase()
          .replace(/[^\w]+/g, "_") +
        "_" +
        Math.random().toString(36).slice(2, 6),
      name: addSectionName.trim(),
      entries: selected.map((id, i) => ({
        id_competidor: id,
        orden: i + 1,
        perExercise: generateDefaultPerExercise(),
        currentExerciseIdx: 0,
        currentAttempt: 1,
      })),
    };
    setSections((prev) => [...prev, newSection]);
    setShowAddSectionModal(false);
  }

  /* -------------------- MODAL: EDITAR ENTRADA -------------------- */
  function openEditEntryModal(sectionId: string, entryIndex: number) {
    setEditingSectionId(sectionId);
    setEditingEntryIndex(entryIndex);
    setShowEditEntryModal(true);
  }
  function saveEditEntry(perExerciseUpdated: SectionEntry["perExercise"], ordenUpdated: number) {
    if (!editingSectionId || editingEntryIndex === null) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id !== editingSectionId
          ? s
          : {
              ...s,
              entries: s.entries.map((e, i) =>
                i === editingEntryIndex
                  ? { ...e, perExercise: perExerciseUpdated, orden: ordenUpdated }
                  : e
              ),
            }
      )
    );
    setShowEditEntryModal(false);
    setEditingSectionId(null);
    setEditingEntryIndex(null);
  }

  /* -------------------- HELPERS: QUEUE -------------------- */
  // Genera una cola plana respetando el orden de secciones y orden interno,
  // y para cada entry devuelve su próximo intento/ejercicio (según currentExerciseIdx/currentAttempt)
  function buildQueue(): QueueItem[] {
    const out: QueueItem[] = [];
    for (const sec of sections) {
      const sorted = [...sec.entries].sort((a, b) => a.orden - b.orden);
      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        // si entry ya terminó todos los ejercicios, lo saltamos (puedes marcar finished con estado)
        if (entry.estado === "finished") continue;
        const ejIdx = entry.currentExerciseIdx;
        const ej = EJERCICIOS[ejIdx] ?? EJERCICIOS[0];
        const attempt = entry.currentAttempt;
        out.push({
          sectionId: sec.id,
          entryIndex: sec.entries.indexOf(entry),
          id_competidor: entry.id_competidor,
          ejercicioId: ej.id,
          ejercicioNombre: ej.nombre,
          intento: attempt,
          tiempo_por_ejercicio: Number(entry.perExercise[ej.id][attempt]) || 60,
        });
      }
    }
    return out;
  }

  /* -------------------- TEMPORIZADOR Y CONTROL -------------------- */
  function formatTime(sec: number | null) {
    if (sec === null) return "--:--";
    const s = Math.max(0, Math.floor(sec));
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }

  // Inicia temporizador para índice en queue
  function startTimerQueueAt(index: number) {
    const queue = buildQueue();
    if (index < 0 || index >= queue.length) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const seconds = queue[index].tiempo_por_ejercicio ?? 60;
    setActiveQueueIndex(index);
    setRemaining(seconds);
    setIsRunning(true);

    const capturedIndex = index;
    timerIntervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          // fin del tiempo
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setIsRunning(false);
          // marcar expirado en la entrada original (incrementar attempt/ejercicio)
          applyEntryFinishForQueueIndex(capturedIndex);
          // avanzar al siguiente existente en queue
          setTimeout(() => {
            const nextQueue = buildQueue();
            const nextIdx = nextQueue.findIndex(
              (_, i) => i > capturedIndex // busca siguiente físico
            );
            // si no hay next que sea index>capturedIndex, revisamos desde 0
            const candidate = nextIdx === -1 ? 0 : nextIdx;
            if (nextQueue.length > 0) startTimerQueueAt(candidate);
            else {
              setActiveQueueIndex(null);
              setRemaining(null);
            }
          }, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pauseTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRunning(false);
  }

  function resumeTimer() {
    if (activeQueueIndex === null || remaining === null || remaining <= 0) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRunning(true);
    const capturedIndex = activeQueueIndex;
    timerIntervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setIsRunning(false);
          applyEntryFinishForQueueIndex(capturedIndex);
          setTimeout(() => {
            const nextQueue = buildQueue();
            if (nextQueue.length > 0) startTimerQueueAt(0);
            else {
              setActiveQueueIndex(null);
              setRemaining(null);
            }
          }, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Forzar siguiente manual para un item en la queue
  function nextForQueueIndex(indexInQueue: number) {
    // stop current
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRunning(false);
    // marcar la entrada como 'skip' y no incrementar attempts (si quieres que se incremente, cambia aquí)
    const queue = buildQueue();
    const item = queue[indexInQueue];
    if (item) {
      setSections((prev) =>
        prev.map((s) =>
          s.id !== item.sectionId
            ? s
            : {
                ...s,
                entries: s.entries.map((e, idx) =>
                  idx === item.entryIndex ? { ...e, estado: "skip" } : e
                ),
              }
        )
      );
    }
    // iniciar siguiente si existe
    const nextQueue = buildQueue();
    if (nextQueue.length > 0) startTimerQueueAt(0);
    else {
      setActiveQueueIndex(null);
      setRemaining(null);
    }
  }

  // Reset del tiempo para un item del queue (vuelve remaining al valor del intento actual)
  function resetForQueueIndex(indexInQueue: number) {
    const queue = buildQueue();
    const item = queue[indexInQueue];
    if (!item) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRunning(false);
    setRemaining(item.tiempo_por_ejercicio ?? 60);
  }

  // Aplicar la conclusión del intento: incrementa el attempt; si >3 => pasa al siguiente ejercicio y reset attempt en 1.
  // Si pasa el último ejercicio también, marcamos finished.
  function applyEntryFinishForQueueIndex(queueIndex: number) {
    const q = buildQueue();
    const item = q[queueIndex];
    if (!item) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id !== item.sectionId
          ? s
          : {
              ...s,
              entries: s.entries.map((e, idx) => {
                if (idx !== item.entryIndex) return e;
                // incrementar attempt
                let newAttempt = e.currentAttempt + 1;
                let newExerciseIdx = e.currentExerciseIdx;
                let newEstado: string | undefined = e.estado;
                if (newAttempt > 3) {
                  // pasar al siguiente ejercicio
                  newExerciseIdx = e.currentExerciseIdx + 1;
                  newAttempt = 1;
                  // si se acabaron ejercicios => marcado finished
                  if (newExerciseIdx >= EJERCICIOS.length) {
                    newEstado = "finished";
                  }
                }
                return {
                  ...e,
                  currentAttempt: newAttempt,
                  currentExerciseIdx: newExerciseIdx,
                  estado: newEstado,
                };
              }),
            }
      )
    );
  }

  /* -------------------- CONTROL GLOBAL desde botones de tarjeta -------------------- */
  // find queue index for a competitor (first occurrence) — usamos buildQueue() ordenada
  function findQueueIndexForCompetitor(id_competidor: number) {
    const q = buildQueue();
    return q.findIndex((it) => it.id_competidor === id_competidor);
  }

  function controlActionForCompetitor(
    action: "start" | "pause" | "resume" | "next" | "reset",
    id_competidor: number
  ) {
    const q = buildQueue();
    const idx = q.findIndex((it) => it.id_competidor === id_competidor);
    if (idx === -1) {
      // si no está en la cola (tal vez finished) mostrar aviso
      alert("Competidor no tiene turno pendiente");
      return;
    }
    if (action === "start") startTimerQueueAt(idx);
    else if (action === "pause") pauseTimer();
    else if (action === "resume") resumeTimer();
    else if (action === "next") nextForQueueIndex(idx);
    else if (action === "reset") resetForQueueIndex(idx);
  }

  /* -------------------- UI helpers: eliminar / mover sección / editar orden -------------------- */
  function removeSection(id: string) {
    if (!confirm("Eliminar sección y sus asignaciones?")) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleCompetitorInSection(sectionId: string, compId: number) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              entries: s.entries.some((e) => e.id_competidor === compId)
                ? s.entries.filter((e) => e.id_competidor !== compId)
                : [
                    ...s.entries,
                    {
                      id_competidor: compId,
                      orden: s.entries.length + 1,
                      perExercise: generateDefaultPerExercise(),
                      currentExerciseIdx: 0,
                      currentAttempt: 1,
                    } as SectionEntry,
                  ],
            }
      )
    );
  }

  // reordenar dentro de sección
  function setEntryOrden(sectionId: string, entryIndex: number, newOrden: number) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const entries = [...s.entries];
        entries[entryIndex] = { ...entries[entryIndex], orden: newOrden };
        // optionally re-sort by orden after update
        return { ...s, entries: entries.sort((a, b) => a.orden - b.orden) };
      })
    );
  }

  /* -------------------- LIFECYCLE CLEANUP -------------------- */
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  /* -------------------- RENDER -------------------- */
  const queue = buildQueue();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Administración: Orden, Secciones y Tiempos (Con Modales)</h1>
      </header>

      <section className={styles.controls}>
        <div className={styles.selectWrap}>
          <label>Competencia</label>
          <select
            value={selectedCompetencia ?? ""}
            onChange={(e) =>
              setSelectedCompetencia(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">-- Seleccione --</option>
            {competencias.map((c) => (
              <option key={c.id_competencia} value={c.id_competencia}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <button className={styles.primary} onClick={openAddSectionModal}>
            <FiPlus style={{ verticalAlign: "middle", marginRight: 6 }} />
            Añadir categoría (card)
          </button>
        </div>
      </section>

      <main className={styles.main}>
        {/* LEFT: secciones y competidores por sección */}
        <div className={styles.left}>
          <h2>Secciones (categorías)</h2>
          {sections.length === 0 && (
            <div className={styles.empty}>No hay secciones. Crea una con "Añadir categoría".</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sections.map((sec) => (
              <div key={sec.id} className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <strong>{sec.name}</strong>
                  <div>
                    <button
                      title="Eliminar sección"
                      onClick={() => removeSection(sec.id)}
                      className={styles.iconBtn}
                    >
                      <FiTrash2 />
                    </button>
                    <button
                      title="Editar sección"
                      onClick={() =>
                        alert(
                          "Editar sección: usa la card del competidor para ajustar pesos/orden. (Modal de edición abre al editar entrada)."
                        )
                      }
                      className={styles.iconBtn}
                    >
                      <FiEdit />
                    </button>
                  </div>
                </div>

                <div className={styles.sectionBody}>
                  {sec.entries.length === 0 && <div className={styles.empty}>Sin competidores</div>}
                  {sec.entries
                    .slice()
                    .sort((a, b) => a.orden - b.orden)
                    .map((entry, idx) => {
                      const comp = competidores.find((c) => c.id_competidor === entry.id_competidor);
                      const queueIndex = queue.findIndex(
                        (q) =>
                          q.id_competidor === entry.id_competidor &&
                          q.sectionId === sec.id
                      );
                      const isActive = activeQueueIndex === queueIndex;
                      return (
                        <div
                          key={entry.id_competidor}
                          className={`${styles.ordenItem} ${
                            isActive ? styles.activeItem : ""
                          } ${entry.estado === "expirado" ? styles.expiredItem : ""}`}
                        >
                          <div className={styles.itemLeft} onClick={() => setSelectedCard({ sectionId: sec.id, entryIndex: idx })}>
                            <div className={styles.ordenBadge}>{entry.orden}</div>
                            <div>
                              <div className={styles.name}>
                                {comp ? `${comp.nombre} ${comp.apellidos}` : `ID ${entry.id_competidor}`}
                              </div>
                              <div className={styles.meta}>
                                Ej: {EJERCICIOS[entry.currentExerciseIdx]?.nombre ?? EJERCICIOS[0].nombre} · Intento: {entry.currentAttempt}
                              </div>
                            </div>
                          </div>

                          <div className={styles.itemRight}>
                            <input
                              type="number"
                              value={entry.orden}
                              onChange={(e) => setEntryOrden(sec.id, idx, Number(e.target.value || 0))}
                              className={styles.timeInput}
                              style={{ width: 72 }}
                            />
                            <div className={styles.controlsSmall}>
                              <button title="Start" onClick={() => controlActionForCompetitor("start", entry.id_competidor)}><FiPlay/></button>
                              <button title="Pause" onClick={() => controlActionForCompetitor("pause", entry.id_competidor)}><FiPause/></button>
                              <button title="Next" onClick={() => controlActionForCompetitor("next", entry.id_competidor)}><FiSkipForward/></button>
                              <button title="Reset" onClick={() => controlActionForCompetitor("reset", entry.id_competidor)}><FiRefreshCw/></button>
                              <button title="Editar" onClick={() => openEditEntryModal(sec.id, idx)} className={styles.iconBtn}><FiEdit/></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: detalles / temporizador / queue */}
        <aside className={styles.right}>
          <h3>Control de Tiempos y Cola</h3>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>Activo:</div>
              <div style={{ minWidth: 120, textAlign: "center", fontWeight: 700 }}>
                {activeQueueIndex !== null && queue[activeQueueIndex]
                  ? `${queue[activeQueueIndex].ejercicioNombre} · Intento ${queue[activeQueueIndex].intento}`
                  : "—"}
              </div>
              <div className={styles.timeDisplay}>{formatTime(remaining ?? null)}</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {!isRunning && (
                <button
                  className={styles.primary}
                  onClick={() => {
                    if (activeQueueIndex !== null) startTimerQueueAt(activeQueueIndex);
                    else if (queue.length > 0) startTimerQueueAt(0);
                    else alert("No hay turns en la cola");
                  }}
                >
                  <FiPlay style={{ marginRight: 6 }} />
                  Start
                </button>
              )}
              {isRunning && (
                <button className={styles.primary} onClick={() => pauseTimer()}>
                  <FiPause style={{ marginRight: 6 }} /> Pause
                </button>
              )}
              <button
                onClick={() => {
                  if (activeQueueIndex !== null) resumeTimer();
                  else if (queue.length > 0) alert("No hay timer activo para reanudar");
                }}
              >
                <FiPlay /> Resume
              </button>
              <button onClick={() => { if (activeQueueIndex !== null) nextForQueueIndex(activeQueueIndex); else alert("No hay item activo para pasar"); }}>
                <FiSkipForward /> Next
              </button>
              <button onClick={() => { if (activeQueueIndex !== null) resetForQueueIndex(activeQueueIndex); else alert("No hay item activo para resetear"); }}>
                <FiRefreshCw /> Reset
              </button>
            </div>
          </div>

          <h4>Cola actual (próximo intento por competidor)</h4>
          <div style={{ maxHeight: 360, overflow: "auto", paddingRight: 6 }}>
            {queue.length === 0 && <div className={styles.empty}>La cola está vacía — añade/organiza secciones</div>}
            {queue.map((qItem, i) => {
              const comp = competidores.find((c) => c.id_competidor === qItem.id_competidor);
              return (
                <div key={`${qItem.sectionId}_${qItem.id_competidor}_${i}`} className={`${styles.ordenItem} ${activeQueueIndex===i ? styles.activeItem : ''}`}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{i+1}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{comp ? `${comp.nombre} ${comp.apellidos}` : `ID ${qItem.id_competidor}`}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{qItem.sectionId} · {qItem.ejercicioNombre} · Intento {qItem.intento}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className={styles.timeDisplay}>{qItem.tiempo_por_ejercicio}s</div>
                    <div className={styles.controlsSmall}>
                      <button onClick={() => controlActionForCompetitor("start", qItem.id_competidor)} title="Start"><FiPlay/></button>
                      <button onClick={() => controlActionForCompetitor("pause", qItem.id_competidor)} title="Pause"><FiPause/></button>
                      <button onClick={() => controlActionForCompetitor("next", qItem.id_competidor)} title="Next"><FiSkipForward/></button>
                      <button onClick={() => controlActionForCompetitor("reset", qItem.id_competidor)} title="Reset"><FiRefreshCw/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <h4>Detalles seleccionado</h4>
            {selectedCard ? (
              (() => {
                const sec = sections.find((s) => s.id === selectedCard.sectionId);
                if (!sec) return <div className={styles.empty}>Sección no encontrada</div>;
                const entry = sec.entries[selectedCard.entryIndex];
                if (!entry) return <div className={styles.empty}>Entrada no encontrada</div>;
                const comp = competidores.find((c) => c.id_competidor === entry.id_competidor);
                return (
                  <div>
                    <div style={{ fontWeight: 800 }}>{comp ? `${comp.nombre} ${comp.apellidos}` : entry.id_competidor}</div>
                    <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
                      Sección: {sec.name} · Orden: {entry.orden}
                    </div>
                    <div>
                      {EJERCICIOS.map((ej) => (
                        <div key={ej.id} style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 700 }}>{ej.nombre}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {[1, 2, 3].map((it) => (
                              <div key={it} style={{ display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: 12 }}>Intento {it}</label>
                                <input
                                  type="number"
                                  value={entry.perExercise[ej.id][it]}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSections((prev) =>
                                      prev.map((s) =>
                                        s.id !== sec.id
                                          ? s
                                          : {
                                              ...s,
                                              entries: s.entries.map((en, idx) =>
                                                idx === selectedCard.entryIndex
                                                  ? {
                                                      ...en,
                                                      perExercise: {
                                                        ...en.perExercise,
                                                        [ej.id]: { ...en.perExercise[ej.id], [it]: val },
                                                      },
                                                    }
                                                  : en
                                              ),
                                            }
                                      )
                                    );
                                  }}
                                  className={styles.pesoInput}
                                  style={{ width: 100 }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEditEntryModal(sec.id, selectedCard.entryIndex)} className={styles.primary}>
                        <FiEdit style={{ marginRight: 6 }} /> Editar en modal
                      </button>
                      <button onClick={() => setSelectedCard(null)} style={{ borderRadius: 6, padding: "8px 10px" }}>
                        Cerrar
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className={styles.empty}>Selecciona una tarjeta en la izquierda para ver/editar</div>
            )}
          </div>
        </aside>
      </main>

      {/* ---------- MODAL: AÑADIR SECCIÓN ---------- */}
      {showAddSectionModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Añadir categoría</h3>
              <button className={styles.iconBtn} onClick={() => setShowAddSectionModal(false)}><FiX /></button>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label>Nombre de la categoría</label>
                <input value={addSectionName} onChange={(e) => setAddSectionName(e.target.value)} className={styles.input} />
                <label style={{ marginTop: 8 }}>Número máximo de participantes (opcional)</label>
                <input type="number" value={addSectionLimit as any} onChange={(e) => setAddSectionLimit(e.target.value ? Number(e.target.value) : "")} className={styles.inputSmall} />
                <div style={{ marginTop: 8 }}>
                  <strong>Selecciona competidores</strong>
                  <div style={{ maxHeight: 220, overflow: "auto", marginTop: 6 }}>
                    {competidores.map((c) => (
                      <label key={c.id_competidor} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
                        <input
                          type="checkbox"
                          checked={addSectionSelectedIds.has(c.id_competidor)}
                          onChange={() => toggleSelectForAdd(c.id_competidor)}
                        />
                        <span>{c.nombre} {c.apellidos} · {c.categoria ?? ""}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ width: 260 }}>
                <div style={{ fontWeight: 700 }}>Resumen</div>
                <div style={{ marginTop: 8 }}>
                  <div>Nombre: <strong>{addSectionName || "(vacío)"}</strong></div>
                  <div>Seleccionados: <strong>{addSectionSelectedIds.size}</strong></div>
                  <div style={{ marginTop: 10 }}>
                    <button className={styles.primary} onClick={confirmAddSection}>Crear categoría</button>
                    <button style={{ marginLeft: 8 }} onClick={() => setShowAddSectionModal(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL: EDITAR ENTRADA (pesos + orden) ---------- */}
      {showEditEntryModal && editingSectionId && editingEntryIndex !== null && (() => {
        const sec = sections.find((s) => s.id === editingSectionId)!;
        const entry = sec.entries[editingEntryIndex]!;
        const comp = competidores.find((c) => c.id_competidor === entry.id_competidor);
        // local copy state to edit inside modal
        let tempPerExercise = JSON.parse(JSON.stringify(entry.perExercise)) as SectionEntry["perExercise"];
        let tempOrden = entry.orden;
        return (
          <EditEntryModal
            compName={comp ? `${comp.nombre} ${comp.apellidos}` : String(entry.id_competidor)}
            initialPerExercise={entry.perExercise}
            initialOrden={entry.orden}
            onClose={() => { setShowEditEntryModal(false); setEditingSectionId(null); setEditingEntryIndex(null); }}
            onSave={(newPerExercise, newOrden) => saveEditEntry(newPerExercise, newOrden)}
          />
        );
      })()}
    </div>
  );
}

/* -------------------- COMPONENTE: MODAL EDIT ENTRY (INLINE) -------------------- */
function EditEntryModal({
  compName,
  initialPerExercise,
  initialOrden,
  onClose,
  onSave,
}: {
  compName: string;
  initialPerExercise: Record<number, { 1: string; 2: string; 3: string }>;
  initialOrden: number;
  onClose: () => void;
  onSave: (perExercise: Record<number, {1:string;2:string;3:string}>, orden: number) => void;
}) {
  const [perExercise, setPerExercise] = useState(initialPerExercise);
  const [orden, setOrden] = useState(initialOrden);

  useEffect(() => {
    setPerExercise(initialPerExercise);
    setOrden(initialOrden);
  }, [initialPerExercise, initialOrden]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Editar entrada — {compName}</h3>
          <button className={styles.iconBtn} onClick={onClose}><FiX/></button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {EJERCICIOS.map((ej) => (
              <div key={ej.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{ej.nombre}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {[1,2,3].map((it) => (
                    <div key={it} style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ fontSize: 12 }}>Intento {it}</label>
                      <input
                        type="number"
                        value={perExercise[ej.id]?.[it] ?? ""}
                        onChange={(e) => setPerExercise(prev => ({ ...prev, [ej.id]: { ...prev[ej.id], [it]: e.target.value } }))}
                        className={styles.pesoInput}
                        style={{ width: 120 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ width: 220 }}>
            <label>Orden dentro de la sección</label>
            <input type="number" value={orden} onChange={(e)=> setOrden(Number(e.target.value || 0))} className={styles.inputSmall} />
            <div style={{ marginTop: 12 }}>
              <button className={styles.primary} onClick={()=> onSave(perExercise, orden)}>Guardar</button>
              <button style={{ marginLeft: 8 }} onClick={onClose}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
