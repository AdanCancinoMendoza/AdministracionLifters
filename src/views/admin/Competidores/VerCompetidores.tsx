import { useEffect, useState } from "react";
import { Edit, Trash2, FileText, Users, ChevronDown, ChevronUp } from "lucide-react";
import styles from "../../../styles/VerCompetidores.module.css";
import axios from "axios";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

interface Competidor {
  id_competidor: number;
  nombre: string;
  apellidos: string;
  peso: string;
  edad: number;
  categoria: string;
  telefono: string;
  correo: string;
  pagado: string;
  id_competencia: number;
  comprobante_pago?: string | null;
  nombre_competencia: string;
  fecha_inscripcion: string;
}

interface Competencia {
  id_competencia: number;
  nombre: string;
  foto?: string | null;
  fecha_inicio?: string | null;
  fecha_cierre?: string | null;
}

export default function VerCompetidores() {
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [baucherUrl, setBaucherUrl] = useState<string | null>(null);
  const [competidorEditar, setCompetidorEditar] = useState<Competidor | null>(null);
  const [competidorEliminar, setCompetidorEliminar] = useState<Competidor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | null>(null);

  const [status, setStatus] = useState<{ open: boolean; type?: "success" | "error" | "info"; title?: string; message?: string }>({ open: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [competidoresRes, competenciasRes] = await Promise.all([
        axios.get("http://localhost:3001/api/competidor"),
        axios.get("http://localhost:3001/api/competenciasadmin"),
      ]);
      setCompetidores(competidoresRes.data);
      setCompetencias(competenciasRes.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setStatus({
        open: true,
        type: "error",
        title: "Error de carga",
        message: "No se pudieron obtener los datos del servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const competidoresPorCompetencia = competidores.reduce<Record<number, Competidor[]>>((acc, comp) => {
    if (!acc[comp.id_competencia]) acc[comp.id_competencia] = [];
    acc[comp.id_competencia].push(comp);
    return acc;
  }, {});

  const handleSelectCompetencia = (id: number) => {
    setSelectedCompetenciaId((prev) => (prev === id ? null : id)); // si ya está abierta, se colapsa
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!competidorEditar) return;
    setSubmitting(true);
    try {
      await axios.put(`http://localhost:3001/api/competidor/${competidorEditar.id_competidor}`, competidorEditar);
      setStatus({ open: true, type: "success", title: "Actualizado", message: "Competidor actualizado correctamente." });
      setCompetidorEditar(null);
      await fetchData();
    } catch (error) {
      console.error("❌ Error al actualizar:", error);
      setStatus({ open: true, type: "error", title: "Error", message: "No se pudo actualizar el competidor." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!competidorEliminar) return;
    setSubmitting(true);
    try {
      await axios.delete(`http://localhost:3001/api/competidor/${competidorEliminar.id_competidor}`);
      setStatus({ open: true, type: "success", title: "Eliminado", message: "Competidor eliminado correctamente." });
      setCompetidorEliminar(null);
      await fetchData();
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
      setStatus({ open: true, type: "error", title: "Error", message: "No se pudo eliminar el competidor." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <LoadingModal open={loading || submitting} title={submitting ? "Procesando..." : undefined} message={submitting ? "Aplicando cambios..." : "Cargando datos..."} />
      <StatusModal open={status.open} type={status.type as any} title={status.title} message={status.message} autoClose duration={3000} onClose={() => setStatus({ open: false })} />

      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Competidores</h1>
        <p className={styles.subtitle}>Selecciona una competencia para ver sus competidores.</p>
      </header>

      <div className={styles.cardsGrid}>
        {competencias.map((comp) => {
          const isSelected = selectedCompetenciaId === comp.id_competencia;
          const competidoresDeComp = competidoresPorCompetencia[comp.id_competencia] ?? [];

          return (
            <div key={comp.id_competencia} className={`${styles.competenciaCard} ${isSelected ? styles.activeCard : ""}`}>
              <div className={styles.cardHeader} onClick={() => handleSelectCompetencia(comp.id_competencia)}>
                <img src={comp.foto ? `http://localhost:3001${comp.foto}` : "/placeholder.png"} alt={comp.nombre} className={styles.cardImage} />
                <div className={styles.cardInfo}>
                  <h3>{comp.nombre}</h3>
                  <p>{comp.fecha_inicio ? new Date(comp.fecha_inicio).toLocaleDateString() : ""}</p>
                  <span className={styles.countBadge}>{competidoresDeComp.length} competidores</span>
                </div>
                {isSelected ? <ChevronUp /> : <ChevronDown />}
              </div>

              {isSelected && (
                <div className={styles.cardBody}>
                  {competidoresDeComp.length === 0 ? (
                    <p className={styles.emptyRow}>No hay competidores registrados.</p>
                  ) : (
                    <table className={styles.tabla}>
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Apellidos</th>
                          <th>Peso</th>
                          <th>Edad</th>
                          <th>Categoría</th>
                          <th>Teléfono</th>
                          <th>Correo</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competidoresDeComp.map((c) => (
                          <tr key={c.id_competidor}>
                            <td>{c.nombre}</td>
                            <td>{c.apellidos}</td>
                            <td>{c.peso} kg</td>
                            <td>{c.edad}</td>
                            <td>{c.categoria}</td>
                            <td>{c.telefono}</td>
                            <td>{c.correo}</td>
                            <td className={styles.acciones}>
                              {c.comprobante_pago && (
                                <button className={styles.verBaucher} onClick={() => setBaucherUrl(`http://localhost:3001${c.comprobante_pago}`)}>
                                  <FileText size={16} />
                                </button>
                              )}
                              <button className={styles.editar} onClick={() => setCompetidorEditar(c)}>
                                <Edit size={16} />
                              </button>
                              <button className={styles.eliminar} onClick={() => setCompetidorEliminar(c)}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal para ver baucher */}
      {baucherUrl && (
        <div className={styles.modalOverlay} onClick={() => setBaucherUrl(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Baucher de Pago</h3>
            <img src={baucherUrl} alt="Baucher" className={styles.modalImagen} />
            <button className={styles.modalCerrar} onClick={() => setBaucherUrl(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal editar competidor */}
      {competidorEditar && (
        <div className={styles.modalOverlay} onClick={() => setCompetidorEditar(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Editar Competidor</h3>
            <form onSubmit={handleUpdate} className={styles.modalForm}>
              <input type="text" value={competidorEditar.nombre} onChange={(e) => setCompetidorEditar({ ...competidorEditar, nombre: e.target.value })} />
              <input type="text" value={competidorEditar.apellidos} onChange={(e) => setCompetidorEditar({ ...competidorEditar, apellidos: e.target.value })} />
              <input type="text" value={competidorEditar.peso} onChange={(e) => setCompetidorEditar({ ...competidorEditar, peso: e.target.value })} />
              <input type="number" value={competidorEditar.edad} onChange={(e) => setCompetidorEditar({ ...competidorEditar, edad: Number(e.target.value) })} />
              <input type="text" value={competidorEditar.categoria} onChange={(e) => setCompetidorEditar({ ...competidorEditar, categoria: e.target.value })} />
              <input type="tel" value={competidorEditar.telefono} onChange={(e) => setCompetidorEditar({ ...competidorEditar, telefono: e.target.value })} />
              <input type="email" value={competidorEditar.correo} onChange={(e) => setCompetidorEditar({ ...competidorEditar, correo: e.target.value })} />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.guardar} disabled={submitting}>Guardar</button>
                <button type="button" className={styles.cancelar} onClick={() => setCompetidorEditar(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar competidor */}
      {competidorEliminar && (
        <div className={styles.modalOverlay} onClick={() => setCompetidorEliminar(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Eliminar Competidor</h3>
            <p>¿Seguro que deseas eliminar a <strong>{competidorEliminar.nombre} {competidorEliminar.apellidos}</strong>?</p>
            <div className={styles.modalButtons}>
              <button onClick={handleDelete} className={styles.eliminarConfirmar} disabled={submitting}>Eliminar</button>
              <button className={styles.cancelar} onClick={() => setCompetidorEliminar(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
