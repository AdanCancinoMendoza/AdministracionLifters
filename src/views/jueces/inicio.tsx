// src/views/jueces/InicioJueces.tsx
import React, { useEffect, useState } from "react";
import styles from "../../styles/InicioJueces.module.css";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral.tsx";
import { useNavigate } from "react-router-dom";
import LoadingModalJuez from "./LoadingModalJuez";

interface Juez {
  id_juez: number;
  id_competencia: number;
  nombre: string;
  apellidos: string;
  usuario: string;
}

interface Competencia {
  id_competencia: number;
  nombre: string;
  foto?: string | null;
  fecha_inicio: string;
  fecha_cierre: string;
}

interface Competidor {
  id_competidor: number;
  nombre: string;
  apellidos?: string;
  peso?: string | null;
  categoria?: string | null;
  id_competencia: number;
  [k: string]: any;
}

interface ModuleItem {
  id: number;
  id_competencia: number;
  title: string;
  pass_number?: number;
  position?: number;
  meta?: any;
}

const API_BASE = "http://localhost:3001";
const COMPETITIONS_API = `${API_BASE}/api/competenciasadmin`;
const COMPETITORS_API = `${API_BASE}/api/competidor`;
const MODULES_API = `${API_BASE}/api/modules`;
const ATTEMPTS_API = `${API_BASE}/api/attempts`;

const InicioJueces: React.FC<{ userJuez: Juez | null; setUserJuez: (j: Juez | null) => void }> = ({
  userJuez,
  setUserJuez,
}) => {
  const navigate = useNavigate();

  const [juez, setJuez] = useState<Juez | null>(userJuez);
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userJuez) {
      navigate("/jueces/login");
      return;
    }
    setJuez(userJuez);
  }, [userJuez, navigate]);

  useEffect(() => {
    if (!juez) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // competencia vinculada al juez
        const compResp = await fetch(`${COMPETITIONS_API}/${juez.id_competencia}`, { signal: ac.signal });
        if (!compResp.ok) throw new Error("No se pudo obtener la competencia");
        const compJson: Competencia = await compResp.json();
        setCompetencia(compJson);

        // competidores (filtramos por competencia)
        const competsResp = await fetch(COMPETITORS_API, { signal: ac.signal });
        if (!competsResp.ok) throw new Error("No se pudieron obtener competidores");
        const competsJson: Competidor[] = await competsResp.json();
        const filtered = competsJson.filter((c) => Number(c.id_competencia) === Number(juez.id_competencia));
        setCompetidores(filtered);

        // módulos
        const modsResp = await fetch(`${MODULES_API}?competition_id=${juez.id_competencia}`, { signal: ac.signal });
        if (!modsResp.ok) {
          setModules([]);
          setAssignments({});
          setLoading(false);
          return;
        }
        const modsJson: ModuleItem[] = await modsResp.json();
        setModules(modsJson);

        // assignments por módulo
        const assignMap: Record<number, string[]> = {};
        await Promise.all(
          modsJson.map(async (m) => {
            try {
              const r = await fetch(`${MODULES_API}/${m.id}/assignments`, { signal: ac.signal });
              if (!r.ok) {
                assignMap[m.id] = [];
                return;
              }
              const a = await r.json();
              assignMap[m.id] = (a || []).map((x: any) => String(x.id_competidor));
            } catch {
              assignMap[m.id] = [];
            }
          })
        );
        setAssignments(assignMap);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError(err.message ?? "Error al cargar datos");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [juez]);

  const formatPeso = (p?: string | null) => (p == null || p === "" ? "—" : `${Number(p).toFixed(2)} kg`);
  const nameOf = (c?: Competidor | null) => (!c ? "—" : `${c.nombre}${c.apellidos ? " " + c.apellidos : ""}`);

  if (!juez) return <p style={{ color: "#666" }}>Redirigiendo a login...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Error: {error}</p>;
  // <-- ya no retornamos si no hay competencia; mostramos placeholders en su lugar

  const imagenCompetencia =
    competencia && competencia.foto && (competencia.foto.startsWith("/uploads/") || competencia.foto.startsWith("/"))
      ? `http://localhost:3001${competencia.foto}`
      : (competencia && competencia.foto) || "";

  return (
    <div className={styles.inicioJuezContainer}>
      <LoadingModalJuez open={loading} message="Cargando datos de la competencia..." variant="spinner" />

      <h1 className={styles.inicioJuezBienvenida}>
        Bienvenido, {juez.nombre} {juez.apellidos}
      </h1>

      <div className={styles.inicioJuezBanner}>
        {imagenCompetencia ? (
          <img src={imagenCompetencia} alt={competencia ? competencia.nombre : "Competencia"} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#7b8794" }}>
            {competencia ? "Sin imagen" : "Competencia cargada próximamente"}
          </div>
        )}
        <div className={styles.overlay}>
          <h2>{competencia ? competencia.nombre : "—"}</h2>
          <p>
            {competencia ? new Date(competencia.fecha_inicio).toLocaleDateString() : "—"} -{" "}
            {competencia ? new Date(competencia.fecha_cierre).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>

      <div className={styles.inicioJuezTotalCard}>Total competidores: {competidores.length}</div>

      <h3 className={styles.inicioJuezSubtitulo} style={{ marginTop: 20 }}>Módulos de la competencia</h3>
      {modules.length === 0 && <p style={{ color: "#666", marginBottom: 12 }}>No se han creado módulos para esta competencia.</p>}

      <div style={{ width: "100%", maxWidth: 900 }}>
        {modules.map((m) => {
          const assignedIds = assignments[m.id] ?? [];
          return (
            <div key={m.id} className={styles.inicioJuezCategoria} style={{ marginBottom: 16 }}>
              <h4>{m.title ?? `Módulo ${m.id}`}</h4>

              {assignedIds.length === 0 ? (
                <p style={{ color: "#666", paddingLeft: 12 }}>No hay competidores asignados a este módulo</p>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {assignedIds.map((idStr) => {
                    const comp = competidores.find((c) => String(c.id_competidor) === idStr) ?? null;
                    return (
                      <div key={idStr} className={styles.inicioJuezCompetidor}>
                        <div>
                          <strong>{nameOf(comp)}</strong>
                        </div>
                        <div style={{ textAlign: "right", color: "#555" }}>
                          ID: {idStr} — Peso: <strong>{formatPeso(comp?.peso)}</strong> • Cat: <strong>{comp?.categoria ?? "—"}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNavigationMenuCentral selected="inicio" />
    </div>
  );
};

export default InicioJueces;
