// src/views/jueces/InformacionScreen.tsx
import React, { useEffect, useState } from "react";
import { FaUser, FaUsers, FaCalendarAlt, FaMoneyBillAlt } from "react-icons/fa";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import styles from "../../styles/InformacionScreen.module.css";
import { useNavigate } from "react-router-dom";

interface JuezProp {
  id_juez: number;
  id_competencia: number;
  nombre?: string;
  apellidos?: string;
  usuario?: string;
}

interface CompetenciaApi {
  id_competencia: number;
  nombre: string;
  tipo?: string;
  foto?: string | null;
  fecha_inicio?: string | null;
  fecha_cierre?: string | null;
  fecha_evento?: string | null;
  categoria?: string | null;
  costo?: string | null;
  lat?: string | null;
  lng?: string | null;
  [k: string]: any;
}

interface JuezApi {
  id_juez: number;
  id_competencia: number;
  nombre: string;
  apellidos?: string;
  usuario?: string;
  [k: string]: any;
}

const API_BASE = "http://localhost:3001";

const InformacionScreen: React.FC<{ userJuez: JuezProp | null; setUserJuez: (j: JuezProp | null) => void }> = ({ userJuez, setUserJuez }) => {
  const navigate = useNavigate();

  const [competencia, setCompetencia] = useState<CompetenciaApi | null>(null);
  const [juecesActivos, setJuecesActivos] = useState<JuezApi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userJuez) {
      navigate("/jueces/login");
      return;
    }

    let mounted = true;
    const ac = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Competencia del juez (por id)
        const compRes = await fetch(`${API_BASE}/api/competenciasadmin/${userJuez.id_competencia}`, { signal: ac.signal });
        if (!compRes.ok) throw new Error("No se pudo obtener la información de la competencia");
        const compJson: CompetenciaApi = await compRes.json();
        if (!mounted) return;
        setCompetencia(compJson);

        // 2) Jueces: traer todos y filtrar por id_competencia
        const jRes = await fetch(`${API_BASE}/api/juez`, { signal: ac.signal });
        if (!jRes.ok) throw new Error("No se pudo obtener la lista de jueces");
        const jJson: JuezApi[] = await jRes.json();
        if (!mounted) return;
        const filtered = (jJson || []).filter(j => Number(j.id_competencia) === Number(userJuez.id_competencia));
        setJuecesActivos(filtered);
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err?.message ?? "Error cargando datos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => { mounted = false; ac.abort(); };
  }, [userJuez, navigate]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("userJuez");
    } catch {}
    setUserJuez(null);
    navigate("/jueces/login");
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return d;
    }
  };

  const getImageUrl = (foto?: string | null) => {
    if (!foto) return "";
    if (foto.startsWith("/uploads/") || foto.startsWith("/")) return `${API_BASE}${foto}`;
    return foto;
  };

  if (!userJuez) return <p style={{ color: "#666" }}>Redirigiendo a login...</p>;
  if (loading) return <p style={{ color: "#666" }}>Cargando información...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Error: {error}</p>;
  if (!competencia) return <p style={{ color: "#666" }}>Competencia no encontrada</p>;

  return (
    <div className={styles.informacionScreen}>
      <div className={styles.informacionContainer}>
        <h1 className={styles.informacionTitulo}>Información del Evento</h1>

        {/* Imagen de la competencia si existe */}
        {competencia.foto ? (
          <div className={styles.infoImagenContainer}>
            <img src={getImageUrl(competencia.foto)} alt={competencia.nombre} className={styles.infoImagen} />
          </div>
        ) : null}

        {/* Tarjeta del usuario (juez logueado) con botón de cerrar sesión */}
        <div className={`${styles.infoCard} ${styles.cardUsuario}`}>
          <div className={styles.cardIcon}><FaUser /></div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Usuario</p>
              <p className={styles.cardText}>{userJuez.nombre} {userJuez.apellidos}</p>
              <p style={{ fontSize: 12, opacity: 0.85 }}>Competencia: <strong>{competencia.nombre}</strong></p>
            </div>

            <div style={{ marginLeft: 12 }}>
              <button
                onClick={handleLogout}
                style={{
                  background: "#e53935",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(229,57,53,0.12)"
                }}
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Tarjeta Jueces activos (de la misma competencia) */}
        <div className={`${styles.infoCard} ${styles.cardJueces}`}>
          <div className={styles.cardHeader}>
            <FaUsers className={styles.cardHeaderIcon} />
            <p className={styles.cardHeaderTitle}>Jueces en esta competencia</p>
          </div>

          {juecesActivos.length === 0 ? (
            <p style={{ marginTop: 8 }}>No hay jueces registrados para esta competencia.</p>
          ) : (
            <ul className={styles.juecesLista}>
              {juecesActivos.map((j, idx) => (
                <li key={j.id_juez ?? idx} className={styles.juezItem}>
                  ✶ {j.nombre} {j.apellidos ?? ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tarjeta Competencia: detalles reales (ubicación removida) */}
        <div className={`${styles.infoCard} ${styles.cardCompetencia}`}>
          <div className={styles.cardHeader}>
            <FaCalendarAlt className={styles.cardHeaderIcon} />
            <p className={styles.cardHeaderTitle}>{competencia.nombre}</p>
          </div>

          <div className={styles.cardFecha}>
            <FaCalendarAlt />
            <span>Inicio: {formatDate(competencia.fecha_inicio)}</span>
          </div>

          <div className={styles.cardFecha}>
            <FaCalendarAlt />
            <span>Cierre: {formatDate(competencia.fecha_cierre)}</span>
          </div>

          <div className={styles.cardFecha}>
            <FaMoneyBillAlt />
            <span>{competencia.costo ? `${Number(competencia.costo).toFixed(2)} MXN` : "Costo no especificado"}</span>
          </div>
        </div>
      </div>

      <BottomNavigationMenuCentral selected="informacion" />
    </div>
  );
};

export default InformacionScreen;
