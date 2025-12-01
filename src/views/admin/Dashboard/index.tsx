// src/views/admin/Dashboard.tsx
import React, { useEffect, useState } from "react";
import MenuAdmin from "../../../components/menu";
import BarChartComponent from "../../../components/charts/BarChart";
import PieChartComponent from "../../../components/charts/PieChart";
import { Users, FileText, DollarSign, Bell, Play } from "lucide-react";
import styles from "../../../styles/Dashboard.module.css";

const API_BASE = "http://localhost:3001/api";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [competidores, setCompetidores] = useState<any[]>([]);
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [lives, setLives] = useState<any[]>([]);

  // Modal para ver info de un evento
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Map para lookup de competencias por id
  const competenciasMap = React.useMemo(() => {
    const map: Record<number, any> = {};
    competencias.forEach((c) => {
      map[c.id_competencia ?? c.id] = c;
    });
    return map;
  }, [competencias]);

  // Métricas básicas
  const totalCompetidores = competidores.length;
  const totalInformes = publicaciones.length;
  const ingresosTotales = competidores.reduce((acc, comp) => {
    if (String(comp.pagado).toLowerCase() === "si") {
      const compObj = competenciasMap[comp.id_competencia];
      if (compObj && compObj.costo) {
        const cost = parseFloat(String(compObj.costo).replace(/[^0-9.-]+/g, ""));
        if (!isNaN(cost)) return acc + cost;
      }
    }
    return acc;
  }, 0);

  // % pagados vs pendientes (por competidor)
  const totalPagados = competidores.filter(c => String(c.pagado).toLowerCase() === "si").length;
  const totalPendientes = totalCompetidores - totalPagados;
  const pctPagados = totalCompetidores ? Math.round((totalPagados / totalCompetidores) * 100) : 0;
  const pctPendientes = 100 - pctPagados;

  // Competidores por competencia (para gráfica)
  const competidoresPorCompetencia = React.useMemo(() => {
    const counts: Record<string, number> = {};
    competidores.forEach((c) => {
      const name = c.nombre_competencia ?? `Competencia ${c.id_competencia ?? "N/A"}`;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([competencia, total]) => ({ competencia, total }));
  }, [competidores]);

  // Dinero acumulado por competencia (para pastel)
  const dineroAcumulado = React.useMemo(() => {
    const money: Record<string, number> = {};
    competidores.forEach((c) => {
      if (String(c.pagado).toLowerCase() === "si") {
        const compObj = competenciasMap[c.id_competencia];
        const name = compObj?.nombre ?? `Competencia ${c.id_competencia}`;
        const cost = compObj ? parseFloat(String(compObj.costo).replace(/[^0-9.-]+/g, "")) : 0;
        if (!isNaN(cost)) money[name] = (money[name] || 0) + cost;
      }
    });
    // incluir competencias con 0
    competencias.forEach((c) => {
      const name = c.nombre ?? `Competencia ${c.id_competencia ?? c.id}`;
      if (!money[name]) money[name] = money[name] || 0;
    });
    return Object.entries(money).map(([competencia, dinero]) => ({ competencia, dinero }));
  }, [competidores, competenciasMap, competencias]);

  // Ingresos por fecha (serie mensual) - agrupamos por YYYY-MM de fecha_inscripcion
  const ingresosPorMes = React.useMemo(() => {
    const map: Record<string, number> = {};
    competidores.forEach((c) => {
      if (String(c.pagado).toLowerCase() === "si" && c.fecha_inscripcion) {
        const d = new Date(c.fecha_inscripcion);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const compObj = competenciasMap[c.id_competencia];
          const cost = compObj ? parseFloat(String(compObj.costo).replace(/[^0-9.-]+/g, "")) : 0;
          if (!isNaN(cost)) map[key] = (map[key] || 0) + cost;
        }
      }
    });
    // ordenar keys cronológicamente
    const entries = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([month, monto]) => ({ month, monto }));
  }, [competidores, competenciasMap]);

  // Top 3 competencias por inscripción
  const topByInscripciones = React.useMemo(() => {
    const counts: Record<string, number> = {};
    competidores.forEach((c) => {
      const name = c.nombre_competencia ?? `Competencia ${c.id_competencia ?? "N/A"}`;
      counts[name] = (counts[name] || 0) + 1;
    });
    const arr = Object.entries(counts).map(([nombre, total]) => ({ nombre, total }));
    return arr.sort((a, b) => b.total - a.total).slice(0, 3);
  }, [competidores]);

  // Top 3 competencias por ingreso (usando dineroAcumulado)
  const topByIngresos = React.useMemo(() => {
    const arr = dineroAcumulado.map(item => ({ nombre: item.competencia, total: item.dinero }));
    return arr.sort((a, b) => b.total - a.total).slice(0, 3);
  }, [dineroAcumulado]);

  // Lives activos / notificaciones
  const livesActivos = lives.filter(l => Number(l.active) === 1 || l.active === 1 || String(l.active) === "1");

  // Datos para la gráfica de ingresos por mes en formato compatible con BarChartComponent
  const ingresosPorMesChart = ingresosPorMes.map(x => ({ mes: x.month, monto: x.monto }));

  // Fetch
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [resCompetidores, resCompetencias, resPublicacion, resLives] = await Promise.all([
          fetch(`${API_BASE}/competidor`, { signal: controller.signal }),
          fetch(`${API_BASE}/competenciasadmin`, { signal: controller.signal }),
          fetch(`${API_BASE}/publicacion`, { signal: controller.signal }),
          fetch(`${API_BASE}/lives`, { signal: controller.signal }),
        ]);

        if (!resCompetidores.ok) throw new Error(`competidor: ${resCompetidores.statusText}`);
        if (!resCompetencias.ok) throw new Error(`competenciasadmin: ${resCompetencias.statusText}`);
        if (!resPublicacion.ok) throw new Error(`publicacion: ${resPublicacion.statusText}`);
        if (!resLives.ok) throw new Error(`lives: ${resLives.statusText}`);

        const [dataCompetidores, dataCompetencias, dataPublicacion, dataLives] = await Promise.all([
          resCompetidores.json(),
          resCompetencias.json(),
          resPublicacion.json(),
          resLives.json(),
        ]);

        if (!mounted) return;

        setCompetidores(Array.isArray(dataCompetidores) ? dataCompetidores : []);
        setCompetencias(Array.isArray(dataCompetencias) ? dataCompetencias : []);
        setPublicaciones(Array.isArray(dataPublicacion) ? dataPublicacion : []);
        setLives(Array.isArray(dataLives) ? dataLives : []);
        setLoading(false);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err.message ?? "Error al obtener datos");
        setLoading(false);
      }
    }

    fetchAll();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (loading) return (
    <div className={styles.dashboardContainer}>
      <MenuAdmin />
      <div className={styles.dashboardContent}><p>Cargando métricas...</p></div>
    </div>
  );

  if (error) return (
    <div className={styles.dashboardContainer}>
      <MenuAdmin />
      <div className={styles.dashboardContent}>
        <div className={styles.errorBox}><strong>Error:</strong> {error}</div>
      </div>
    </div>
  );

  // Próximos eventos ordenados por fecha_evento ascendente
  const proxEventos = [...competencias]
    .filter(c => c.fecha_evento)
    .sort((a, b) => new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime());

  return (
    <div className={styles.dashboardContainer}>
      <MenuAdmin />
      <div className={styles.dashboardContent}>
        <h1 className={styles.dashboardTitle}>Dashboard de Competencias</h1>

        <div className={styles.dashboardCards}>
          <div className={`${styles.card} ${styles.cardBlue}`}>
            <Users className={styles.cardIcon} />
            <div>
              <h3>Competidores Registrados</h3>
              <p>{totalCompetidores}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardGreen}`}>
            <FileText className={styles.cardIcon} />
            <div>
              <h3>Informes / Publicaciones</h3>
              <p>{totalInformes}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardPurple}`}>
            <DollarSign className={styles.cardIcon} />
            <div>
              <h3>Ingresos Totales</h3>
              <p>${ingresosTotales.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardYellow || ""}`}>
            <Bell className={styles.cardIcon} />
            <div>
              <h3>Lives Activos</h3>
              <p>{livesActivos.length} activo(s)</p>
            </div>
          </div>
        </div>

        {/* Porcentaje pagados vs pendientes */}
        <div style={{ marginTop: 18, marginBottom: 18 }}>
          <h3>Porcentaje de inscritos - Pagados vs Pendientes</h3>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Pagados: {totalPagados} ({pctPagados}%)</div>
              <div style={{ background: "#e6e6e6", borderRadius: 8, overflow: "hidden", height: 14 }}>
                <div style={{
                  width: `${pctPagados}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #6EE7B7, #10B981)",
                  transition: "width .6s"
                }} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Pendientes: {totalPendientes} ({pctPendientes}%)</div>
              <div style={{ background: "#e6e6e6", borderRadius: 8, overflow: "hidden", height: 14 }}>
                <div style={{
                  width: `${pctPendientes}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #FCA5A5, #EF4444)",
                  transition: "width .6s"
                }} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dashboardCharts}>
          <div className={styles.chartCard}>
            <h3>Competidores por Competencia</h3>
            {competidoresPorCompetencia.length ? (
              <BarChartComponent
                data={competidoresPorCompetencia}
                dataKey="total"
                labelKey="competencia"
              />
            ) : <p>No hay datos suficientes.</p>}
          </div>

          <div className={styles.chartCard}>
            <h3>Dinero Acumulado por Competencia</h3>
            {dineroAcumulado.length ? (
              <PieChartComponent
                data={dineroAcumulado}
                dataKey="dinero"
                nameKey="competencia"
              />
            ) : <p>No hay datos suficientes.</p>}
          </div>
        </div>

        <div className={styles.dashboardCharts}>
          <div className={styles.chartCard}>
            <h3>Ingresos por mes (pagos registrados)</h3>
            {ingresosPorMesChart.length ? (
              <BarChartComponent
                data={ingresosPorMesChart}
                dataKey="monto"
                labelKey="mes"
              />
            ) : <p>No hay ingresos registrados por mes.</p>}
          </div>

          <div className={styles.chartCard}>
            <h3>Top 3 - Inscripciones</h3>
            {topByInscripciones.length ? (
              <div>
                {topByInscripciones.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <div>{i + 1}. {t.nombre}</div>
                    <div>{t.total}</div>
                  </div>
                ))}
              </div>
            ) : <p>No hay datos.</p>}
            <hr />
            <h3>Top 3 - Ingresos</h3>
            {topByIngresos.length ? (
              <div>
                {topByIngresos.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <div>{i + 1}. {t.nombre}</div>
                    <div>${Number(t.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>
            ) : <p>No hay datos.</p>}
          </div>
        </div>

        {/* Próximos eventos */}
        <div style={{ marginTop: 20 }}>
          <h3>Próximos eventos</h3>
          {proxEventos.length ? (
            <div>
              {proxEventos.map((ev: any) => {
                const date = ev.fecha_evento ? new Date(ev.fecha_evento) : null;
                return (
                  <div key={ev.id_competencia ?? ev.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <div>
                      <strong>{ev.nombre}</strong>
                      <div style={{ fontSize: 13, color: "#161616ff" }}>{date ? date.toLocaleString() : "Sin fecha"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className={styles.smallButton} onClick={() => setSelectedEvent(ev)}>Ver info</button>
                      {ev.foto && <a href={ev.foto.startsWith("http") ? ev.foto : `http://localhost:3001${ev.foto}`} target="_blank" rel="noreferrer" className={styles.smallButton}>Imagen</a>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p>No hay eventos próximos.</p>}
        </div>

        {/* Lives activos / notificaciones */}
        <div style={{ marginTop: 20 }}>
          <h3>Notificaciones de Lives</h3>
          {livesActivos.length ? (
            <div>
              {livesActivos.map((l: any) => (
                <div key={l.id_live ?? l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <div>
                    <strong>{l.title ?? "Live"}</strong>
                    <div style={{ fontSize: 13, color: "#000000ff" }}>{l.nombre_competencia ?? ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {l.youtube_url && <a href={l.youtube_url} target="_blank" rel="noreferrer" className={styles.smallButton}><Play size={14} /> Ver</a>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p>No hay lives activos.</p>}
        </div>

        <div className={styles.dashboardInfo} style={{ marginTop: 24 }}>
          <p>
            Este dashboard ahora incluye porcentaje de pagos, próximos eventos, ingresos por mes, 
            top competencias por inscripción e ingresos, y notificaciones de lives activos.
          </p>
        </div>

        {/* Modal simple */}
        {selectedEvent && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000
          }}>
            <div style={{ background: "#fff", width: 800, maxWidth: "95%", borderRadius: 8, padding: 20 }}>
              <h3>{selectedEvent.nombre}</h3>
              <p><strong>Tipo:</strong> {selectedEvent.tipo}</p>
              <p><strong>Categoría:</strong> {selectedEvent.categoria}</p>
              <p><strong>Costo:</strong> {selectedEvent.costo}</p>
              <p><strong>Ubicación:</strong> {selectedEvent.ubicacion}</p>
              <p><strong>Fecha evento:</strong> {selectedEvent.fecha_evento ? new Date(selectedEvent.fecha_evento).toLocaleString() : "Sin fecha"}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <button className={styles.smallButton} onClick={() => setSelectedEvent(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
