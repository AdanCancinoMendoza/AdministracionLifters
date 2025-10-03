import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../styles/AsignarJuez.css";

interface Competencia {
  id: string;
  nombre: string;
  foto: string;
  fechaInicio: string;
  fechaConclusion: string;
}

interface Juez {
  id: string;
  nombre: string;
  apellidos: string;
  usuario: string;
  password: string;
}

const competenciaEjemplo: Competencia = {
  id: "1",
  nombre: "Copa Nacional de Fuerza",
  foto: "https://media.istockphoto.com/id/1135093085/es/foto/discovery-mexico-campeche.jpg?s=612x612&w=0&k=20&c=v6c4Lg2aFZHZP_OrXLmCcozJfp-MXiq_EyKydCpdMvU=",
  fechaInicio: "2025-10-01",
  fechaConclusion: "2025-10-03",
};

const AsignarJueces: React.FC<{ competencia?: Competencia }> = ({
  competencia = competenciaEjemplo,
}) => {
  const [jueces, setJueces] = useState<Juez[]>([]);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellidos: "", usuario: "" });
  const [juezSeleccionado, setJuezSeleccionado] = useState<Juez | null>(null);

  const generarPassword = () => {
    const caracteres = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let pass = "";
    for (let i = 0; i < 5; i++) {
      pass += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return pass;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // AGREGAR NUEVO JUEZ
  const handleAgregar = () => {
    const nuevoJuez: Juez = {
      id: Date.now().toString(),
      nombre: form.nombre,
      apellidos: form.apellidos,
      usuario: form.usuario,
      password: generarPassword(),
    };
    setJueces([...jueces, nuevoJuez]);
    setForm({ nombre: "", apellidos: "", usuario: "" });
    setModalAgregar(false);
  };

  // EDITAR JUEZ
  const handleEditar = () => {
    if (!juezSeleccionado) return;
    setJueces(
      jueces.map((j) =>
        j.id === juezSeleccionado.id ? { ...j, ...form } : j
      )
    );
    setModalEditar(false);
    setJuezSeleccionado(null);
    setForm({ nombre: "", apellidos: "", usuario: "" });
  };

  // ELIMINAR JUEZ
  const handleEliminar = () => {
    if (!juezSeleccionado) return;
    setJueces(jueces.filter((j) => j.id !== juezSeleccionado.id));
    setModalEliminar(false);
    setJuezSeleccionado(null);
  };

  const seleccionarJuez = (juez: Juez, accion: "editar" | "eliminar") => {
    setJuezSeleccionado(juez);
    setForm({ nombre: juez.nombre, apellidos: juez.apellidos, usuario: juez.usuario });
    if (accion === "editar") setModalEditar(true);
    else setModalEliminar(true);
  };

  const inicio = new Date(competencia.fechaInicio);
  const fin = new Date(competencia.fechaConclusion);

  return (
    <div className="asignar-container">
      {/* Titulo y descripción */}
      <h1>Gestión de Jueces</h1>
      <p>En este apartado puedes asociar jueces a la competencia, editarlos o eliminarlos según sea necesario.</p>


      {/* Nombre competencia */}
      <h2 className="competencia-nombre">{competencia.nombre}</h2>

      {/* Contenedor fila: Imagen + Calendario */}
      <div className="competencia-fila">
        <div className="competencia-imagen">
          <img src={competencia.foto} alt={competencia.nombre} />
        </div>

        <div className="competencia-calendario">
          <Calendar
            selectRange={true}
            value={[inicio, fin]}
            tileClassName={({ date }) =>
              date >= inicio && date <= fin ? "rango-fechas" : null
            }
          />
        </div>
      </div>

      {/* Fechas de texto */}
      <div className="fechas-competencia">
        <p>
          <strong>Inicio:</strong> {inicio.toLocaleDateString("es-ES")}
        </p>
        <p>
          <strong>Fin:</strong> {fin.toLocaleDateString("es-ES")}
        </p>
      </div>

      {/* Botón para agregar juez */}
      <button className="btn-registrar" onClick={() => setModalAgregar(true)}>
        Agregar Juez
      </button>

      {/* MODAL AGREGAR */}
      {modalAgregar && (
        <div className="modal-fondo">
          <div className="modal-contenido">
            <h3>Agregar Juez</h3>
            <div className="form-grupo">
              <label>Nombre</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} />
            </div>
            <div className="form-grupo">
              <label>Apellidos</label>
              <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} />
            </div>
            <div className="form-grupo">
              <label>Usuario</label>
              <input type="text" name="usuario" value={form.usuario} onChange={handleChange} />
            </div>
            <button onClick={handleAgregar}>Guardar</button>
            <button onClick={() => setModalAgregar(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="modal-fondo">
          <div className="modal-contenido">
            <h3>Editar Juez</h3>
            <div className="form-grupo">
              <label>Nombre</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} />
            </div>
            <div className="form-grupo">
              <label>Apellidos</label>
              <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} />
            </div>
            <div className="form-grupo">
              <label>Usuario</label>
              <input type="text" name="usuario" value={form.usuario} onChange={handleChange} />
            </div>
            <button onClick={handleEditar}>Guardar</button>
            <button onClick={() => setModalEditar(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="modal-fondo">
          <div className="modal-contenido">
            <h3>Eliminar Juez</h3>
            <p>¿Estás seguro que deseas eliminar al juez "{juezSeleccionado?.nombre}"?</p>
            <button onClick={handleEliminar}>Eliminar</button>
            <button onClick={() => setModalEliminar(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista de jueces registrados */}
      <div className="lista-jueces">
        <h3 className="lista-titulo">Jueces Registrados</h3>
        {jueces.length === 0 ? (
          <p className="lista-vacia">No hay jueces registrados aún.</p>
        ) : (
          <table className="tabla-jueces">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Usuario</th>
                <th>Contraseña</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {jueces.map((juez) => (
                <tr key={juez.id}>
                  <td>{juez.nombre}</td>
                  <td>{juez.apellidos}</td>
                  <td>{juez.usuario}</td>
                  <td>{juez.password}</td>
                  <td>
                    <button onClick={() => seleccionarJuez(juez, "editar")}>Editar</button>
                    <button onClick={() => seleccionarJuez(juez, "eliminar")}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AsignarJueces;
