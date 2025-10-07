import { useEffect, useState } from "react";
import { Edit, Trash2, FileText, Users } from "lucide-react";
import "../../../styles/VerCompetidores.css";
import { db } from "../../../firebase";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

interface Competidor {
  id: string;
  nombre: string;
  apellidos: string;
  peso: number;
  categoria: string;
  telefono: string;
  correo: string;
  baucherUrl: string;
}

interface Competencia {
  id: string;
  nombre: string;
  fechaInicio: Timestamp;
  fechaCierre: Timestamp;
  foto: string;
  competidores: Competidor[];
}

export default function VerCompetidores() {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [baucherUrl, setBaucherUrl] = useState<string | null>(null);
  const [competidorEditar, setCompetidorEditar] = useState<Competidor | null>(null);
  const [competidorEliminar, setCompetidorEliminar] = useState<Competidor | null>(null);

  useEffect(() => {
    const fetchCompetencias = async () => {
      const now = Timestamp.now();
      const q = query(
        collection(db, "competencias"),
        where("fechaCierre", ">", now),
        orderBy("fechaCierre", "asc")
      );

      const querySnapshot = await getDocs(q);
      const competenciasData: Competencia[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const competidoresSnap = await getDocs(collection(db, `competencias/${docSnap.id}/competidores`));
        const competidores: Competidor[] = competidoresSnap.docs.map(c => ({
          id: c.id,
          nombre: c.data().nombre,
          apellidos: c.data().apellidos,
          peso: c.data().peso,
          categoria: c.data().categoria,
          telefono: c.data().telefono,
          correo: c.data().correo,
          baucherUrl: c.data().baucherUrl || "",
        }));
        competenciasData.push({
          id: docSnap.id,
          nombre: data.nombre,
          fechaInicio: data.fechaInicio,
          fechaCierre: data.fechaCierre,
          foto: data.foto,
          competidores,
        });
      }

      setCompetencias(competenciasData);
    };

    fetchCompetencias();
  }, []);

  const totalCompetidores = competencias.reduce(
    (acc, comp) => acc + comp.competidores.length,
    0
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
          <p className="competidores-resumen-numero">{totalCompetidores}</p>
        </div>
      </div>

      {competencias.map((competencia) => (
        <div key={competencia.id} className="competencia-card">
          <div className="competencia-info">
            <img src={competencia.foto} alt={competencia.nombre} className="competencia-foto" />
            <div>
              <h2 className="competencia-nombre">{competencia.nombre}</h2>
              <p className="competencia-fechas">
                {competencia.fechaInicio.toDate().toLocaleDateString()} - {competencia.fechaCierre.toDate().toLocaleDateString()}
              </p>
            </div>
          </div>

          <table className="competidores-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Peso</th>
                <th>Categoría</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {competencia.competidores.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{c.apellidos}</td>
                  <td>{c.peso} kg</td>
                  <td>{c.categoria}</td>
                  <td>{c.telefono}</td>
                  <td>{c.correo}</td>
                  <td className="competidor-acciones">
                    <button className="btn-ver-baucher" onClick={() => setBaucherUrl(c.baucherUrl)}>
                      <FileText size={16} />
                    </button>
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
      ))}

      {/* Modales */}
      {baucherUrl && (
        <div className="modal-overlay" onClick={() => setBaucherUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-titulo">Baucher de Pago</h3>
            <img src={baucherUrl} alt="Baucher" className="modal-imagen" />
            <button className="modal-cerrar" onClick={() => setBaucherUrl(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {competidorEditar && (
        <div className="modal-overlay" onClick={() => setCompetidorEditar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-titulo">Editar Competidor</h3>
            <form className="form-editar">
              <input type="text" defaultValue={competidorEditar.nombre} />
              <input type="text" defaultValue={competidorEditar.apellidos} />
              <input type="number" defaultValue={competidorEditar.peso} />
              <input type="text" defaultValue={competidorEditar.categoria} />
              <input type="tel" defaultValue={competidorEditar.telefono} />
              <input type="email" defaultValue={competidorEditar.correo} />
              <div className="form-botones">
                <button type="submit" className="btn-guardar">Guardar</button>
                <button type="button" className="btn-cancelar" onClick={() => setCompetidorEditar(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {competidorEliminar && (
        <div className="modal-overlay" onClick={() => setCompetidorEliminar(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-titulo">Eliminar Competidor</h3>
            <p>¿Seguro que deseas eliminar a <strong>{competidorEliminar.nombre} {competidorEliminar.apellidos}</strong>?</p>
            <div className="form-botones">
              <button className="btn-eliminar-confirmar">Eliminar</button>
              <button className="btn-cancelar" onClick={() => setCompetidorEliminar(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
