// src/frontend/.../AdminLivePanel.tsx
import React, { useEffect, useState } from "react";
import styles from '../../../styles/AdminLivePanel.module.css';

type Competencia = {
  id_competencia: number;
  nombre: string;
  foto?: string | null;
  fecha_evento?: string | null;
};

type LiveStream = {
  id_live?: number;
  id_competencia: number;
  youtube_url: string;
  title?: string | null;
  active: number;
  start_datetime?: string | null;
};

const BASE = "http://localhost:3001";
const COMPETICIONES_API = `${BASE}/api/competenciasadmin`;
const LIVE_STREAMS_API = `${BASE}/api/lives`; // coincide con server.js

/** Validación básica de URL de YouTube */
function isYouTubeUrl(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes("youtube.com") || host.includes("youtu.be");
  } catch {
    return false;
  }
}

/** Convierte datetime-local (YYYY-MM-DDTHH:mm) -> ISO string (UTC) */
function localDateTimeToISO(value?: string | null) {
  if (!value) return null;
  const d = new Date(value); // interpreta como local
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Extrae ID y devuelve embed url */
function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (url.includes("/embed/")) return url;
  } catch {}
  return url;
}

export default function AdminLivePanel() {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<LiveStream>({
    id_competencia: 0,
    youtube_url: "",
    title: "",
    active: 0,
    start_datetime: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingIds, setTogglingIds] = useState<number[]>([]); // filas en proceso de toggle

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([fetch(COMPETICIONES_API), fetch(LIVE_STREAMS_API)]);
      const comps = await cRes.json();
      const ss = await sRes.json();
      // Ajuste de rutas de imagen completas
      const compsNormalized = (Array.isArray(comps) ? comps : []).map((c: any) => ({
        ...c,
        foto: c.foto ? `${BASE}${c.foto}` : null
      }));
      setCompetencias(compsNormalized);
      setStreams(Array.isArray(ss) ? ss : []);
    } catch (err) {
      console.error("fetchData AdminLivePanel:", err);
      alert("Error cargando datos. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ id_competencia: 0, youtube_url: "", title: "", active: 0, start_datetime: "" });
    setEditingId(null);
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!form.id_competencia || !form.youtube_url) {
      alert("Selecciona una competencia y pega la URL de YouTube.");
      return;
    }
    if (!isYouTubeUrl(form.youtube_url.trim())) {
      alert("La URL proporcionada no parece ser de YouTube.");
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${LIVE_STREAMS_API}/${editingId}` : LIVE_STREAMS_API;

      const payload = {
        id_competencia: Number(form.id_competencia),
        youtube_url: form.youtube_url.trim(),
        title: form.title?.trim() || null,
        active: Number(form.active) === 1 ? 1 : 0,
        start_datetime: localDateTimeToISO(form.start_datetime) // null o ISO
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error guardando");
      }

      await fetchData();
      resetForm();
      alert(editingId ? "Transmisión actualizada" : "Transmisión creada");
    } catch (err) {
      console.error("handleSave error:", err);
      alert("Ocurrió un error al guardar. Ver consola.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(stream: LiveStream) {
    setEditingId(stream.id_live ?? null);
    let localValue = "";
    if (stream.start_datetime) {
      const d = new Date(stream.start_datetime);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => (n < 10 ? `0${n}` : n);
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const min = pad(d.getMinutes());
        localValue = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
      }
    }
    setForm({
      id_competencia: stream.id_competencia,
      youtube_url: stream.youtube_url,
      title: stream.title ?? "",
      active: stream.active ? 1 : 0,
      start_datetime: localValue
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    if (!confirm("Eliminar este stream?")) return;
    try {
      const res = await fetch(`${LIVE_STREAMS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando");
      await fetchData();
      alert("Stream eliminado");
    } catch (err) {
      console.error("handleDelete", err);
      alert("No se pudo eliminar.");
    }
  }

  async function toggleActive(id?: number, current?: number) {
    if (!id) return;
    if (togglingIds.includes(id)) return;

    try {
      setTogglingIds(prev => [...prev, id]);
      const getRes = await fetch(`${LIVE_STREAMS_API}/${id}`);
      if (!getRes.ok) throw new Error("No se pudo obtener el stream existente.");
      const existing = await getRes.json();
      const payload = {
        id_competencia: Number(existing.id_competencia),
        youtube_url: existing.youtube_url,
        title: existing.title ?? null,
        active: current ? 0 : 1,
        start_datetime: existing.start_datetime ?? null
      };
      const putRes = await fetch(`${LIVE_STREAMS_API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!putRes.ok) throw new Error("Error cambiando estado en el servidor.");
      await fetchData();
    } catch (err) {
      console.error("toggleActive error:", err);
      alert("Error cambiando estado. Revisa la consola para más detalles.");
    } finally {
      setTogglingIds(prev => prev.filter(x => x !== id));
    }
  }

  const selectedCompetencia = competencias.find(c => c.id_competencia === form.id_competencia);

  return (
    <div className={styles.adminPanel}>
      <div className={styles.header}>
        <h2>Panel de Transmisiones en Vivo</h2>
        <p className={styles.headerSub}>Crea, edita y activa streams asociados a una competencia.</p>
      </div>

      <section className={styles.formSection}>
        <form onSubmit={(e) => handleSave(e)} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.col}>
              <label>Competencia</label>
              <select
                value={form.id_competencia}
                onChange={e => setForm({ ...form, id_competencia: Number(e.target.value) })}
                className={styles.select}
              >
                <option value={0}>-- Selecciona competencia --</option>
                {competencias.map(c => (
                  <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>
                ))}
              </select>

              <label>Título (opcional)</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Título público (ej. transmisión oficial)"
                className={styles.inputField}
              />

              <label>URL de YouTube</label>
              <input
                value={form.youtube_url}
                onChange={e => setForm({ ...form, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=XXXX"
                className={styles.inputField}
              />

              <label>Programar inicio (opcional)</label>
              <input
                type="datetime-local"
                value={form.start_datetime || ""}
                onChange={e => setForm({ ...form, start_datetime: e.target.value })}
                className={styles.inputField}
              />

              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
                />
                <span> Activar transmisión (mostrar en la vista pública)</span>
              </label>

              <div className={styles.formActions}>
                <button type="submit" disabled={saving} className={styles.primaryBtn}>
                  {saving ? "Guardando..." : (editingId ? "Guardar cambios" : "Crear transmisión")}
                </button>
                <button type="button" onClick={resetForm} className={styles.ghostBtn}>Limpiar</button>
              </div>
            </div>

            <div className={styles.colPreview}>
              {selectedCompetencia ? (
                <div className={styles.previewCard}>
                  <img src={selectedCompetencia.foto ?? `${BASE}/uploads/placeholder.png`} alt={selectedCompetencia.nombre} />
                  <div className={styles.previewMeta}>
                    <strong>{selectedCompetencia.nombre}</strong>
                    {selectedCompetencia.fecha_evento && <div className={styles.dateSmall}>{new Date(selectedCompetencia.fecha_evento).toLocaleString()}</div>}
                    <div className={styles.badge}>{selectedCompetencia.tipo}</div>
                  </div>
                  {form.youtube_url && isYouTubeUrl(form.youtube_url) && (
                    <a href={toYouTubeEmbed(form.youtube_url)} target="_blank" rel="noreferrer" className={styles.previewWatch}>Vista previa del Embed</a>
                  )}
                </div>
              ) : (
                <div className={styles.previewEmpty}>
                  <div>No hay competencia seleccionada</div>
                </div>
              )}
            </div>
          </div>
        </form>
      </section>

      <section className={styles.listSection}>
        <h3>Transmisiones existentes</h3>
        {loading ? <p>Cargando...</p> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Competencia</th>
                  <th>Título</th>
                  <th>URL</th>
                  <th>Inicio</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {streams.map(s => {
                  const comp = competencias.find(c => c.id_competencia === s.id_competencia);
                  const toggling = togglingIds.includes(s.id_live ?? -1);
                  return (
                    <tr key={s.id_live}>
                      <td className={styles.cellCompetencia}>
                        {comp ? (
                          <div className={styles.cellCompInner}>
                            <img src={comp.foto ?? `${BASE}/uploads/placeholder.png`} alt={comp.nombre}/>
                            <div>{comp.nombre}</div>
                          </div>
                        ) : s.id_competencia}
                      </td>
                      <td>{s.title ?? "-"}</td>
                      <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.youtube_url}</td>
                      <td>{s.start_datetime ? new Date(s.start_datetime).toLocaleString() : "-"}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!s.active}
                          onChange={() => toggleActive(s.id_live, s.active)}
                          disabled={toggling}
                        />
                        {toggling && <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b" }}>Procesando...</span>}
                      </td>
                      <td className={styles.actionsCell}>
                        <button onClick={() => handleEdit(s)} className={styles.actionBtn}>Editar</button>
                        <button onClick={() => handleDelete(s.id_live)} className={styles.actionBtnDanger}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
