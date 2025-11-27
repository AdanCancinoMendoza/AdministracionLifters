// src/pages/ResultadosScreen.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../../styles/ResultadosVista.module.css";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

type Competition = {
  id_competencia: number;
  nombre: string;
  tipo?: string;
  foto?: string;
  fecha_evento?: string;
};

type Competitor = {
  id_competidor: number;
  nombre: string;
  apellidos: string;
  peso?: string;
  edad?: number;
  categoria?: string;
  telefono?: string;
  correo?: string;
  pagado?: string;
  id_competencia: number;
  nombre_competencia?: string;
  foto_competencia?: string;
};

type Attempt = {
  id: number;
  id_competencia: number;
  id_competidor: number;
  exercise_id: number;
  module_id: number;
  attempt_number: number;
  weight_kg: string;
  approved: number | null; // 1,0,null
  judge_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function ResultadosScreen() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const [loading, setLoading] = useState(false); // fetching data
  const [modalSaving, setModalSaving] = useState(false); // saving action modal
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Status modal state
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  const [statusTitle, setStatusTitle] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);

  const COMPETITIONS_URL = "http://localhost:3001/api/competenciasadmin";
  const COMPETITORS_URL = "http://localhost:3001/api/competidor";
  const ATTEMPTS_BY_COMPETITOR = (id_competencia: number, id_competidor: number) =>
    `http://localhost:3001/api/attempts/by-competitor?id_competencia=${id_competencia}&id_competidor=${id_competidor}`;

  // helper para nombres de ejercicios
  function exerciseName(id: number) {
    switch (id) {
      case 1:
        return "Press Banca";
      case 2:
        return "Peso Muerto";
      case 3:
        return "Sentadilla";
      default:
        return `Ejercicio ${id}`;
    }
  }

  useEffect(() => {
    loadCompetitions();
  }, []);

  async function loadCompetitions() {
    try {
      setLoading(true);
      const res = await axios.get<Competition[]>(COMPETITIONS_URL);
      setCompetitions(res.data || []);
      if ((res.data || []).length > 0) setSelectedCompetition(res.data[0].id_competencia);
    } catch (err: any) {
      const msg = "Error cargando competencias: " + (err?.message || err);
      setError(msg);
      openStatus("error", "Error", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCompetition != null) loadCompetitors(selectedCompetition);
    setSelectedCompetitor(null);
    setAttempts([]);
  }, [selectedCompetition]);

  async function loadCompetitors(id_competencia: number) {
    try {
      setLoading(true);
      const res = await axios.get<Competitor[]>(COMPETITORS_URL);
      const filtered = (res.data || []).filter((c) => c.id_competencia === id_competencia);
      setCompetitors(filtered);
      if (filtered.length > 0) setSelectedCompetitor(filtered[0].id_competidor);
    } catch (err: any) {
      const msg = "Error cargando competidores: " + (err?.message || err);
      setError(msg);
      openStatus("error", "Error", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCompetition && selectedCompetitor) {
      loadAttempts(selectedCompetition, selectedCompetitor);
    } else {
      setAttempts([]);
    }
  }, [selectedCompetitor, selectedCompetition]);

  async function loadAttempts(id_competencia: number, id_competidor: number) {
    try {
      setLoading(true);
      const res = await axios.get<Attempt[]>(ATTEMPTS_BY_COMPETITOR(id_competencia, id_competidor));
      setAttempts(res.data || []);
    } catch (err: any) {
      const msg = "Error cargando intentos: " + (err?.message || err);
      setError(msg);
      openStatus("error", "Error", msg);
    } finally {
      setLoading(false);
    }
  }

  // parseNotes se mantiene por si quieres usarlo en modal/historial
  function parseNotes(notes: string | null) {
    if (!notes) return "-";
    try {
      const parsed = JSON.parse(notes);
      if (!Array.isArray(parsed)) return String(parsed);
      return parsed.map((n: any) => `${n.valor ?? n.text ?? JSON.stringify(n)}`).join(" | ");
    } catch {
      return notes;
    }
  }

  function prettyApproved(v: number | null) {
    if (v === 1) return "Aprobado";
    if (v === 0) return "Rechazado";
    return "Pendiente";
  }

  function openStatus(type: "success" | "error" | "info", title?: string, message?: string) {
    setStatusType(type);
    setStatusTitle(title);
    setStatusMessage(message);
    setStatusOpen(true);
  }

  /**
   * ADMIN: guardar aprobado/rechazado permitiendo sobrescribir.
   * PATCH /api/attempts/{id}/approve
   * body: { approved: boolean|null, judge_id: null, force: true }
   */
  async function saveApproved(attemptId: number, value: number | null) {
    // guardado desde panel admin
    setSavingId(attemptId);
    setModalSaving(true);
    setError(null);

    const original = attempts.map((a) => ({ ...a }));
    // optimistic update
    setAttempts((prev) => prev.map((a) => (a.id === attemptId ? { ...a, approved: value } : a)));

    try {
      const body = { approved: value === null ? null : Boolean(value), judge_id: null, force: true };
      await axios.patch(`http://localhost:3001/api/attempts/${attemptId}/approve`, body);

      // mostrar success y recargar intentos para sincronizar estado real con backend
      openStatus("success", "Guardado", "La calificación se guardó correctamente.");
      // recargar intentos (si tenemos competencia y competidor seleccionado)
      if (selectedCompetition && selectedCompetitor) {
        await loadAttempts(selectedCompetition, selectedCompetitor);
      }
    } catch (err: any) {
      // rollback
      setAttempts(original);

      if (err?.response?.status === 409) {
        const msg = "No se pudo actualizar: intento ya calificado por otro juez (409).";
        setError(msg);
        openStatus("error", "Conflicto", msg);
      } else {
        const msg = "Error guardando calificación: " + (err?.message || err);
        setError(msg);
        openStatus("error", "Error", msg);
      }
    } finally {
      setSavingId(null);
      setModalSaving(false);
    }
  }

  const currentCompetition = competitions.find((c) => c.id_competencia === selectedCompetition);

  // helper para rutas de imagen si vienen relativas
  const SERVER_BASE = "http://localhost:3001";
  function getImageSrc(foto?: string | null) {
    if (!foto) return "";
    if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
    if (foto.startsWith("/")) return `${SERVER_BASE}${foto}`;
    return `${SERVER_BASE}/${foto}`;
  }

  return (
    <div className={styles.container}>
      <LoadingModal
        open={loading || modalSaving}
        title={modalSaving ? "Guardando..." : undefined}
        message={modalSaving ? "Guardando calificación..." : "Cargando..."}
        subMessage={modalSaving ? undefined : undefined}
        showSpinner={true}
        overlayClickable={false}
      />

      <StatusModal
        open={statusOpen}
        type={statusType}
        title={statusTitle}
        message={statusMessage}
        autoClose={true}
        duration={3000}
        onClose={() => setStatusOpen(false)}
      />

      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Resultados</h1>
            <p className={styles.subtitle}>Panel para revisar y editar calificaciones</p>
          </div>
        </header>

        <section className={styles.controlsGrid}>
          <div className={styles.leftPanel}>
            <label className={styles.label}>Seleccionar competencia</label>
            <select
              className={styles.select}
              value={selectedCompetition ?? ""}
              onChange={(e) => setSelectedCompetition(Number(e.target.value) || null)}
              disabled={modalSaving || loading}
            >
              <option value="">-- Elige una competencia --</option>
              {competitions.map((c) => (
                <option key={c.id_competencia} value={c.id_competencia}>
                  {c.nombre.trim()}
                </option>
              ))}
            </select>

            {selectedCompetition && (
              <div className={styles.competitionCard}>
                <div className={styles.competitionInfo}>
                  <h2 className={styles.competitionName}>{currentCompetition?.nombre}</h2>
                  <p className={styles.competitionDate}>
                    Fecha evento: {new Date(currentCompetition?.fecha_evento || "").toLocaleDateString()}
                  </p>

                  {/* Imagen debajo del texto */}
                  {currentCompetition?.foto && (
                    <div className={styles.competitionImageWrapper}>
                      <img
                        src={getImageSrc(currentCompetition.foto)}
                        alt={`${currentCompetition.nombre} - foto`}
                        className={styles.competitionFullImage}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className={styles.rightPanel}>
            <h3 className={styles.panelTitle}>Competidores</h3>
            {loading && <div className={styles.hint}>Cargando...</div>}
            {!loading && competitors.length === 0 && <div className={styles.empty}>No hay competidores para la competencia seleccionada.</div>}

            <ul className={styles.competitorsList}>
              {competitors.map((cmp) => (
                <li
                  key={cmp.id_competidor}
                  className={`${styles.competitorItem} ${selectedCompetitor === cmp.id_competidor ? styles.activeCompetitor : ""}`}
                  onClick={() => !modalSaving && setSelectedCompetitor(cmp.id_competidor)}
                >
                  <div>
                    <div className={styles.competitorName}>{cmp.nombre} {cmp.apellidos}</div>
                    <div className={styles.competitorMeta}>{cmp.categoria} • {cmp.peso} kg</div>
                  </div>
                  <div className={styles.compPaid}>{cmp.pagado === 'Si' ? 'Pago' : ''}</div>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Registro de intentos</h3>
            <div className={styles.tableHint}>Seleccione un competidor para ver y editar</div>
          </div>

          {selectedCompetitor == null ? (
            <div className={styles.emptyLarge}>Selecciona un competidor para ver sus intentos.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Ejercicio</th>
                    <th className={styles.th}>Intento</th>
                    <th className={styles.th}>Peso (kg)</th>
                    <th className={styles.th}>Estado</th>
                    <th className={styles.th}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id} className={styles.tr}>
                      <td className={styles.td}>{exerciseName(a.exercise_id)}</td>
                      <td className={styles.td}>{a.attempt_number}</td>
                      <td className={styles.td}>{a.weight_kg}</td>
                      <td className={styles.td}>
                        <span className={a.approved === 1 ? styles.statusApproved : a.approved === 0 ? styles.statusRejected : styles.statusPending}>
                          {prettyApproved(a.approved)}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <div className={styles.actions}>
                          {/* ADMIN: siempre editable desde este panel */}
                          <select
                            value={a.approved === null ? "pending" : a.approved === 1 ? "approved" : "rejected"}
                            onChange={(e) => {
                              const val = e.target.value === "approved" ? 1 : e.target.value === "rejected" ? 0 : null;
                              setAttempts((prev) => prev.map((row) => (row.id === a.id ? { ...row, approved: val } : row)));
                            }}
                            className={styles.smallSelect}
                            disabled={modalSaving || savingId === a.id}
                          >
                            <option value="approved">Aprobado</option>
                            <option value="rejected">Rechazado</option>
                            <option value="pending">Pendiente</option>
                          </select>

                          <button
                            onClick={() => saveApproved(a.id, a.approved)}
                            className={styles.saveBtn}
                            disabled={modalSaving || savingId === a.id}
                          >
                            {modalSaving && savingId === a.id ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {attempts.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.emptyRow}>No hay intentos registrados para este competidor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
