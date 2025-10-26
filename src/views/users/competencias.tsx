import React, { useEffect, useState, useMemo } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import esLocale from '@fullcalendar/core/locales/es';
import styles from "../../styles/Competencias.module.css";

type Competencia = {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto: string;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  fecha_evento: string | null;
  categoria: string;
  costo: string;
  ubicacion: string | null;
  lat: string | null;
  lng: string | null;
  fecha_creacion: string | null;
};

export default function CompetenciasView(): JSX.Element {
  const API = "http://localhost:3001/api/competenciasadmin";

  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "nuevas" | "ultimas">("all");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(API)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setCompetencias(data || []);
      })
      .catch((err) => {
        console.error("Error al obtener competencias:", err);
        setCompetencias([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const now = new Date();

  const filtered = useMemo(() => {
    if (filter === "all") return competencias;
    if (filter === "nuevas") {
      return competencias.filter((c) => c.fecha_evento && new Date(c.fecha_evento) >= now);
    }
    return competencias.filter((c) => c.fecha_evento && new Date(c.fecha_evento) < now);
  }, [competencias, filter, now]);

  // Colors for event types
  const EVENT_COLORS = {
    inicio: "#60a5fa", // azul
    cierre: "#f59e0b", // ámbar
    evento: "#10b981", // verde
  };

  const events = useMemo(() => {
    const ev: any[] = [];
    competencias.forEach((c) => {
      if (c.fecha_inicio) ev.push({
        id: `${c.id_competencia}-inicio`,
        title: `${c.nombre} · Inscripciones abren`,
        start: c.fecha_inicio,
        allDay: true,
        color: EVENT_COLORS.inicio,
        extendedProps: { tipo: "inicio", competencia: c },
      });
      if (c.fecha_cierre) ev.push({
        id: `${c.id_competencia}-cierre`,
        title: `${c.nombre} · Cierre inscripciones`,
        start: c.fecha_cierre,
        allDay: true,
        color: EVENT_COLORS.cierre,
        extendedProps: { tipo: "cierre", competencia: c },
      });
      if (c.fecha_evento) ev.push({
        id: `${c.id_competencia}-evento`,
        title: `${c.nombre} · Evento`,
        start: c.fecha_evento,
        allDay: true,
        color: EVENT_COLORS.evento,
        extendedProps: { tipo: "evento", competencia: c },
      });
    });
    return ev;
  }, [competencias]);

  function parseUbicacion(u: string | null, latField?: string | null, lngField?: string | null) {
    if (!u || u.trim() === "") {
      if (latField && lngField && latField !== "0.000000" && lngField !== "0.000000")
        return { lat: latField, lng: lngField };
      return null;
    }
    const latMatch = u.match(/Lat:\s*([-+]?\d*\.?\d+)/i);
    const lngMatch = u.match(/Lng:\s*([-+]?\d*\.?\d+)/i);
    if (latMatch && lngMatch) return { lat: latMatch[1], lng: lngMatch[1] };
    return null;
  }

  function imageUrl(foto: string) {
    if (!foto) return "";
    if (foto.startsWith("http")) return foto;
    return `http://localhost:3001${foto}`;
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <h2 className={styles.brand}>Mis Competencias</h2>

        <div className={styles.filterRow}>
          <button className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`} onClick={() => setFilter("all")}>Todas</button>
          <button className={`${styles.filterBtn} ${filter === "nuevas" ? styles.active : ""}`} onClick={() => setFilter("nuevas")}>Nuevas</button>
          <button className={`${styles.filterBtn} ${filter === "ultimas" ? styles.active : ""}`} onClick={() => setFilter("ultimas")}>Últimas</button>
        </div>

        <div className={styles.listPreview}>
          {loading && <div className={styles.loading}>Cargando...</div>}
          {!loading && filtered.length === 0 && <div className={styles.empty}>No hay competencias para mostrar.</div>}
          {!loading && filtered.slice(0, 6).map((c) => (
            <div key={c.id_competencia} className={styles.previewCard}>
              <img src={imageUrl(c.foto)} alt={c.nombre} className={styles.thumb}
                onError={(e: any) => { e.target.src = 'https://via.placeholder.com/120x80?text=Sin+imagen' }} />
              <div className={styles.previewInfo}>
                <div className={styles.previewTitle}>{c.nombre}</div>
                <div className={styles.previewMeta}>{c.categoria} · ${c.costo}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.legend}>
          <div><span className={styles.dot} style={{ background: EVENT_COLORS.inicio }} />Inscripciones Inicio</div>
          <div><span className={styles.dot} style={{ background: EVENT_COLORS.cierre }} />Cierre Inscripciones</div>
          <div><span className={styles.dot} style={{ background: EVENT_COLORS.evento }} />Evento</div>
        </div>
      </aside>

      <main className={styles.content}>
        <section className={styles.calendarWrap}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView={"dayGridMonth"}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            locale={esLocale}
            events={events}
            height={"auto"}
          />
        </section>

        <section className={styles.cardsGrid}>
          {filtered.map((c) => (
            <article key={c.id_competencia} className={styles.card}>
              <div className={styles.cardMedia}>
                <img src={imageUrl(c.foto)} alt={c.nombre}
                  onError={(e: any) => { e.target.src = 'https://via.placeholder.com/600x300?text=Sin+imagen' }} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{c.nombre}</h3>
                <p className={styles.cardMeta}>{c.tipo} · {c.categoria} · ${c.costo}</p>

                <div className={styles.dateRow}>
                  <div>
                    <strong>Inscripciones:</strong>
                    <br />
                    <small>
                      {c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleString() : '—'} →
                      {c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString() : '—'}
                    </small>
                  </div>
                  <div>
                    <strong>Evento:</strong>
                    <br />
                    <small>{c.fecha_evento ? new Date(c.fecha_evento).toLocaleString() : '—'}</small>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button className={styles.btnOutline} onClick={() => setShowResultsModal(true)}>Resultados</button>
                </div>

                {(() => {
                  const geo = parseUbicacion(c.ubicacion, c.lat, c.lng);
                  if (!geo) return null;
                  return (
                    <div className={styles.mapSmall}>
                      <iframe title={`map-${c.id_competencia}`}
                        src={`https://www.google.com/maps?q=${geo.lat},${geo.lng}&output=embed`}
                        loading="lazy"
                      />
                    </div>
                  );
                })()}
              </div>
            </article>
          ))}
        </section>
      </main>

      {showResultsModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowResultsModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowResultsModal(false)}>×</button>
            <div className={styles.modalContentSmall}>
              <h3>Resultados (estáticos)</h3>
              <table className={styles.resultsTable}>
                <thead>
                  <tr><th>#</th><th>Competidor</th><th>País/Club</th><th>Resultado</th></tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Ana Pérez</td><td>Club Norte</td><td>9.85</td></tr>
                  <tr><td>2</td><td>Carlos Méndez</td><td>Team Verde</td><td>9.72</td></tr>
                  <tr><td>3</td><td>Luisa Gómez</td><td>Club Centro</td><td>9.60</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
