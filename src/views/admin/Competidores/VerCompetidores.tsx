import { useState } from "react";
import { Edit, Trash2, FileText, Users } from "lucide-react";
import "../../../styles/VerCompetidores.css";

interface Competidor {
  id: number;
  nombre: string;
  apellidos: string;
  peso: number;
  categoria: string;
  telefono: string;
  correo: string;
  baucherUrl: string;
}

interface Competencia {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaCierre: string;
  foto: string;
  competidores: Competidor[];
}

const competencias: Competencia[] = [
  {
    id: 1,
    nombre: "Powerlifting Estatal",
    fechaInicio: "2025-10-01",
    fechaCierre: "2025-10-05",
    foto: "https://escapadas.mexicodesconocido.com.mx/wp-content/uploads/2024/01/Puebla-Ciudad-visitmexico.jpg",
    competidores: [
      {
        id: 1,
        nombre: "Carlos",
        apellidos: "García",
        peso: 82.5,
        categoria: "-83kg",
        telefono: "555-123-4567",
        correo: "carlos@example.com",
        baucherUrl: "https://imgv2-1-f.scribdassets.com/img/document/358541868/original/f077a82030/1?v=1",
      },
    ],
  },
];

export default function VerCompetidores() {
  const [baucherUrl, setBaucherUrl] = useState<string | null>(null);
  const [competidorEditar, setCompetidorEditar] = useState<Competidor | null>(null);
  const [competidorEliminar, setCompetidorEliminar] = useState<Competidor | null>(null);

  const totalCompetidores = competencias.reduce(
    (acc, comp) => acc + comp.competidores.length,
    0
  );

  return (
    <div className="competidores-container">
      {/* Encabezado */}
      <div className="competidores-header">
        <h1 className="competidores-titulo">Gestión de Competidores</h1>
        <p className="competidores-descripcion">
          Aquí puedes visualizar los competidores registrados en cada competencia,
          acceder a su baucher de pago, y administrarlos mediante edición o eliminación.
        </p>
      </div>

      {/* Resumen */}
      <div className="competidores-resumen">
        <Users size={40} />
        <div>
          <p className="competidores-resumen-texto">Competidores Registrados</p>
          <p className="competidores-resumen-numero">{totalCompetidores}</p>
        </div>
      </div>

      {/* Secciones de competencias */}
      {competencias.map((competencia) => (
        <div key={competencia.id} className="competencia-card">
          <div className="competencia-info">
            <img
              src={competencia.foto}
              alt={competencia.nombre}
              className="competencia-foto"
            />
            <div>
              <h2 className="competencia-nombre">{competencia.nombre}</h2>
              <p className="competencia-fechas">
                {competencia.fechaInicio} - {competencia.fechaCierre}
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
                    <button
                      className="btn-ver-baucher"
                      onClick={() => setBaucherUrl(c.baucherUrl)}
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      className="btn-editar"
                      onClick={() => setCompetidorEditar(c)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => setCompetidorEliminar(c)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

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

      {/* Modal Eliminar */}
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
