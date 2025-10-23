import { useEffect, useState } from "react";
import { Edit, Trash2, FileText, Users } from "lucide-react";
import styles from "../../../styles/VerCompetidores.module.css";
import axios from "axios";

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
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [competidoresRes, competenciasRes] = await Promise.all([
        axios.get("http://localhost:3001/api/competidor"),
        axios.get("http://localhost:3001/api/competenciasadmin"),
      ]);
      setCompetidores(competidoresRes.data);
      setCompetencias(competenciasRes.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!competidorEditar) return;
    try {
      await axios.put(`http://localhost:3001/api/competidor/${competidorEditar.id_competidor}`, competidorEditar);
      alert("✅ Competidor actualizado correctamente");
      setCompetidorEditar(null);
      fetchData();
    } catch (error) {
      console.error("❌ Error al actualizar:", error);
      alert("Error al actualizar el competidor");
    }
  };

  const handleDelete = async () => {
    if (!competidorEliminar) return;
    if (!confirm("¿Seguro que deseas eliminar este competidor?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/competidor/${competidorEliminar.id_competidor}`);
      alert("✅ Competidor eliminado correctamente");
      setCompetidorEliminar(null);
      fetchData();
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
      alert("Error al eliminar el competidor");
    }
  };

  if (loading) return <p className={styles.loading}>Cargando competencias y competidores...</p>;

  const competidoresPorCompetencia = competidores.reduce(
    (acc: Record<number, Competidor[]>, comp) => {
      if (!acc[comp.id_competencia]) acc[comp.id_competencia] = [];
      acc[comp.id_competencia].push(comp);
      return acc;
    },
    {}
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Competidores</h1>
        <p className={styles.subtitle}>
          Aquí puedes visualizar los competidores registrados en cada competencia,
          acceder a su baucher de pago, y administrarlos mediante edición o eliminación.
        </p>
      </header>

      <section className={styles.resumen}>
        <Users size={40} />
        <div>
          <p className={styles.resumenTexto}>Competidores Registrados</p>
          <p className={styles.resumenNumero}>{competidores.length}</p>
        </div>
      </section>

      {Object.entries(competidoresPorCompetencia).map(([idCompetencia, listaCompetidores]) => {
        const competencia = competencias.find(c => c.id_competencia === parseInt(idCompetencia));
        const nombreCompetencia = listaCompetidores[0]?.nombre_competencia || "Sin nombre";

        return (
          <div key={idCompetencia} className={styles.competenciaCard}>
            <div className={styles.competenciaInfo}>
              <img
                src={competencia?.foto ? `http://localhost:3001${competencia.foto}` : "/placeholder.png"}
                alt={nombreCompetencia}
                className={styles.competenciaFoto}
              />
              <div>
                <h2 className={styles.competenciaNombre}>{nombreCompetencia}</h2>
                {competencia?.fecha_inicio && competencia?.fecha_cierre && (
                  <p className={styles.competenciaFechas}>
                    {new Date(competencia.fecha_inicio).toLocaleDateString()} -{" "}
                    {new Date(competencia.fecha_cierre).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

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
                {listaCompetidores.map(c => (
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
                        <button
                          className={styles.verBaucher}
                          onClick={() => setBaucherUrl(`http://localhost:3001${c.comprobante_pago}`)}
                        >
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
          </div>
        );
      })}

      {/* Modales */}
      {baucherUrl && (
        <div className={styles.modalOverlay} onClick={() => setBaucherUrl(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Baucher de Pago</h3>
            <img src={baucherUrl} alt="Baucher" className={styles.modalImagen} />
            <button className={styles.modalCerrar} onClick={() => setBaucherUrl(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {competidorEditar && (
        <div className={styles.modalOverlay} onClick={() => setCompetidorEditar(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Editar Competidor</h3>
            <form onSubmit={handleUpdate} className={styles.modalForm}>
              <input type="text" value={competidorEditar.nombre} onChange={e => setCompetidorEditar({...competidorEditar, nombre: e.target.value})} />
              <input type="text" value={competidorEditar.apellidos} onChange={e => setCompetidorEditar({...competidorEditar, apellidos: e.target.value})} />
              <input type="number" value={competidorEditar.peso} onChange={e => setCompetidorEditar({...competidorEditar, peso: e.target.value})} />
              <input type="number" value={competidorEditar.edad} onChange={e => setCompetidorEditar({...competidorEditar, edad: parseInt(e.target.value)})} />
              <input type="text" value={competidorEditar.categoria} onChange={e => setCompetidorEditar({...competidorEditar, categoria: e.target.value})} />
              <input type="tel" value={competidorEditar.telefono} onChange={e => setCompetidorEditar({...competidorEditar, telefono: e.target.value})} />
              <input type="email" value={competidorEditar.correo} onChange={e => setCompetidorEditar({...competidorEditar, correo: e.target.value})} />
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.guardar}>Guardar</button>
                <button type="button" className={styles.cancelar} onClick={() => setCompetidorEditar(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {competidorEliminar && (
        <div className={styles.modalOverlay} onClick={() => setCompetidorEliminar(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Eliminar Competidor</h3>
            <p>¿Seguro que deseas eliminar a <strong>{competidorEliminar.nombre} {competidorEliminar.apellidos}</strong>?</p>
            <div className={styles.modalButtons}>
              <button onClick={handleDelete} className={styles.eliminarConfirmar}>Eliminar</button>
              <button className={styles.cancelar} onClick={() => setCompetidorEliminar(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
