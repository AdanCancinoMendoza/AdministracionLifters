import React, { useEffect, useMemo, useState } from "react";
import styles from '../../styles/UsersLiveResults.module.css';

type Competencia = {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto?: string | null;
  fecha_evento?: string | null;
  ubicacion?: string | null;
};

type Attempt = { weight: string; ok: boolean };
type Lifter = {
  number: string;
  name: string;
  weightClass: string;
  snatch: Attempt[];
  bench: Attempt[];
  deadlift: Attempt[];
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

const SAMPLE_LIFTERS: Lifter[] = [
  {
    number: "001",
    name: "Adán Cancino",
    weightClass: "70 kg",
    snatch: [{ weight: "50 kg", ok: false }, { weight: "50 kg", ok: true }, { weight: "52 kg", ok: false }],
    bench: [{ weight: "80 kg", ok: true }, { weight: "82.5 kg", ok: false }, { weight: "82.5 kg", ok: true }],
    deadlift: [{ weight: "150 kg", ok: true }, { weight: "155 kg", ok: true }, { weight: "160 kg", ok: true }],
  },
  {
    number: "002",
    name: "Brayan Emanuel",
    weightClass: "85 kg",
    snatch: [{ weight: "60 kg", ok: true }, { weight: "65 kg", ok: true }, { weight: "70 kg", ok: false }],
    bench: [{ weight: "70 kg", ok: true }, { weight: "75 kg", ok: true }, { weight: "80 kg", ok: false }],
    deadlift: [{ weight: "90 kg", ok: true }, { weight: "95 kg", ok: true }, { weight: "100 kg", ok: true }],
  },
];

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
  const [liftersByComp, setLiftersByComp] = useState<Record<number, Lifter[]>>({});
  const [activeStreams, setActiveStreams] = useState<Record<number, LiveStream>>({});

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
    const map: Record<number, Lifter[]> = {};
    for (const comp of liveCompetitions) {
      map[comp.id_competencia] = SAMPLE_LIFTERS.map(l => ({ ...l }));
    }
    setLiftersByComp(map);
  }, [liveCompetitions]);

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.centerSpinner}>Cargando resultados...</div>
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
              <rect x="0" y="0" width="260" height="160" rx="12" fill="#f4f7fb"/>
              <g transform="translate(30,28)">
                <rect width="160" height="90" rx="8" fill="#e9f2ff"/>
                <rect x="8" y="8" width="40" height="20" rx="4" fill="#d6e9ff"/>
                <rect x="56" y="8" width="96" height="10" rx="5" fill="#dbeeff"/>
                <rect x="8" y="36" width="144" height="8" rx="4" fill="#eaf4ff"/>
                <rect x="8" y="52" width="70" height="8" rx="4" fill="#eaf4ff"/>
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
        const lifters = liftersByComp[comp.id_competencia] ?? [];
        const stream = activeStreams[comp.id_competencia];

        return (
          <article key={comp.id_competencia} className={styles.liveCard}>
            <header className={styles.liveHeader}>
              <div className={styles.headerLeft}>
                {stream ? <span className={styles.statusBadge}>EN VIVO</span> : <span className={styles.statusBadgeGray}>EN ESPERA</span>}
                <h3 className={styles.eventTitle}>{comp.nombre}{stream && stream.title ? ` — ${stream.title}` : ''}</h3>
              </div>

              {/* MEDIA: imagen + (si existe) video EMBED en la misma fila */}
              <div className={styles.headerMedia}>
                <div className={styles.mediaLeft}>
                  <img src={comp.foto ?? "https://via.placeholder.com/640x360?text=Evento"} alt={comp.nombre} className={styles.eventImage} />
                  { !stream && <div className={styles.mediaOverlayText}>Próximo</div> }
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
                      <th className={styles.groupHeader} colSpan={3}>Arranque</th>
                      <th className={styles.groupHeader} colSpan={3}>Press Banca</th>
                      <th className={styles.groupHeader} colSpan={3}>Peso Muerto</th>
                    </tr>
                    <tr>
                      <th colSpan={3}></th>
                      <th>1</th><th>2</th><th>3</th>
                      <th>1</th><th>2</th><th>3</th>
                      <th>1</th><th>2</th><th>3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifters.map((l, i) => (
                      <tr key={i}>
                        <td>{l.number}</td>
                        <td className={styles.nameCell}>{l.name}</td>
                        <td>{l.weightClass}</td>

                        {l.snatch.map((a, idx) => (
                          <td key={`s-${idx}`}><span className={a.ok ? styles.attemptOk : styles.attemptFail}>{a.weight}</span></td>
                        ))}

                        {l.bench.map((a, idx) => (
                          <td key={`b-${idx}`}><span className={a.ok ? styles.attemptOk : styles.attemptFail}>{a.weight}</span></td>
                        ))}

                        {l.deadlift.map((a, idx) => (
                          <td key={`d-${idx}`}><span className={a.ok ? styles.attemptOk : styles.attemptFail}>{a.weight}</span></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.actionsRow}>
                <button className={styles.primary}>Ver todos los resultados</button>
                <button className={styles.ghost}>Descargar hoja de resultados (CSV)</button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
