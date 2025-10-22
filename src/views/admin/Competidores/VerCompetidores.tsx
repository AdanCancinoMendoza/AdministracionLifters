import { useEffect, useState } from "react";
import { Edit, Trash2, FileText, Users } from "lucide-react";
import "../../../styles/VerCompetidores.css";
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

  // Cargar datos
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

  // Actualizar competidor
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

  // Eliminar competidor
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

  if (loading) return <p>Cargando competencias y competidores...</p>;

  // Agrupar competidores por competencia
  const competidoresPorCompetencia = competidores.reduce(
    (acc: Record<number, Competidor[]>, comp) => {
      if (!acc[comp.id_competencia]) acc[comp.id_competencia] = [];
      acc[comp.id_competencia].push(comp);
      return acc;
    },
    {}
  );

  return (
    <div className="competidores-container">
      <div className="competidores-header">
        <h1 className="competidores-titulo">Gestión de Competidores</h1>
        <p className="competidores-descripcion">
          Aquí puedes visualizar los competidores registrados en cada competencia,
          acceder a su baucher de pago, y administrarlos mediante edición o eliminación.
        </p>
      </div>

      <div className="competidores-resumen">
        <Users size={40} />
        <div>
          <p className="competidores-resumen-texto">Competidores Registrados</p>
          <p className="competidores-resumen-numero">{competidores.length}</p>
        </div>
      </div>

      {Object.entries(competidoresPorCompetencia).map(([idCompetencia, listaCompetidores]) => {
        const competencia = competencias.find(
          (c) => c.id_competencia === parseInt(idCompetencia)
        );
        const nombreCompetencia = listaCompetidores[0]?.nombre_competencia || "Sin nombre";

        return (
          <div key={idCompetencia} className="competencia-card">
            <div className="competencia-info">
              <img
                src={
                  competencia?.foto
                    ? `http://localhost:3001${competencia.foto}`
                    : "/placeholder.png"
                }
                alt={nombreCompetencia}
                className="competencia-foto"
              />
              <div>
                <h2 className="competencia-nombre">{nombreCompetencia}</h2>
                {competencia?.fecha_inicio && competencia?.fecha_cierre && (
                  <p className="competencia-fechas">
                    {new Date(competencia.fecha_inicio).toLocaleDateString()} -{" "}
                    {new Date(competencia.fecha_cierre).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <table className="competidores-tabla">
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
                {listaCompetidores.map((c) => (
                  <tr key={c.id_competidor}>
                    <td>{c.nombre}</td>
                    <td>{c.apellidos}</td>
                    <td>{c.peso} kg</td>
                    <td>{c.edad}</td>
                    <td>{c.categoria}</td>
                    <td>{c.telefono}</td>
                    <td>{c.correo}</td>
                    <td className="competidor-acciones">
                      {c.comprobante_pago && (
                        <button
                          className="btn-ver-baucher"
                          onClick={() =>
                            setBaucherUrl(`http://localhost:3001${c.comprobante_pago}`)
                          }
                        >
                          <FileText size={16} />
                        </button>
                      )}
                      <button className="btn-editar" onClick={() => setCompetidorEditar(c)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-eliminar" onClick={() => setCompetidorEliminar(c)}>
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

      {/* Modal Baucher */}
      {baucherUrl && (
        <div className="modal-overlay" onClick={() => setBaucherUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-titulo">Baucher de Pago</h3>
            <img src={baucherUrl} alt="Baucher" className="modal-imagen" />
            <button className="modal-cerrar" onClick={() => setBaucherUrl(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {competidorEditar && (
        <div className="modal-overlay" onClick={() => setCompetidorEditar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-titulo">Editar Competidor</h3>
            <form onSubmit={handleUpdate} className="form-editar">
              <input
                type="text"
                value={competidorEditar.nombre}
                onChange={(e) =>
                  setCompetidorEditar({ ...competidorEditar, nombre: e.target.value })
                }
              />
              <input
                type="text"
                value={competidorEditar.apellidos}
                onChange={(e) =>
                  setCompetidorEditar({ ...competidorEditar, apellidos: e.target.value })
                }
              />
              <input
                type="number"
                value={competidorEditar.peso}
                onChange={(e) =>
                  setCompetidorEditar({ ...competidorEditar, peso: e.target.value })
                }
              />
              <input
                type="number"
                value={competidorEditar.edad}
                onChange={(e) =>
                  setCompetidorEditar({ ...competidorEditar, edad: parseInt(e.target.value) })
                }
              />
              <input
                type="text"
                value={competidorEditar.categoria}
                onChange={(e) =>
                  setCompetidorEditar({ ...competidorEditar, categoria: e.target.value })
                }
              />
              <input
                type="tel"
                value={competidorEditar.telefono}
                onChange={(e) =>
                  setCompetidorEditar({ ...competidorEditar, telefono: e.target.value })
                }
              />
              <input
                type="email"
                value={competidorEditar.correo}
                onChange={(e) =>
                  setCompetidorEditar({ ...competidorEditar, correo: e.target.value })
                }
              />
              <div className="form-botones">
                <button type="submit" className="btn-guardar">
                  Guardar
                </button>
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setCompetidorEditar(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {competidorEliminar && (
        <div className="modal-overlay" onClick={() => setCompetidorEliminar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-titulo">Eliminar Competidor</h3>
            <p>
              ¿Seguro que deseas eliminar a{" "}
              <strong>
                {competidorEliminar.nombre} {competidorEliminar.apellidos}
              </strong>
              ?
            </p>
            <div className="form-botones">
              <button onClick={handleDelete} className="btn-eliminar-confirmar">
                Eliminar
              </button>
              <button className="btn-cancelar" onClick={() => setCompetidorEliminar(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
