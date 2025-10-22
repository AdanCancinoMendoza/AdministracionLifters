import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../styles/AsignarJuez.css";
import Logo from "../../../assets/LOgo.png"; 

import { db } from "../../../firebase";
import {
  collection,
  getDocs,
  Timestamp,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

interface Competencia {
  id: string;
  nombre: string;
  foto: string;
  fechaInicio: Date;
  fechaCierre: Date;
  fechaEvento: Date;
  fechaCreacion: Date;
}

interface Juez {
  id: string;
  nombre: string;
  apellidos: string;
  usuario: string;
  password: string;
}


const AsignarJueces: React.FC = () => {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] =
    useState<Competencia | null>(null);
  const [jueces, setJueces] = useState<Juez[]>([]);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellidos: "", usuario: "" });
  const [juezSeleccionado, setJuezSeleccionado] = useState<Juez | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Cargar competencias desde Firestore
  useEffect(() => {
    const cargarCompetencias = async () => {
      const snapshot = await getDocs(collection(db, "competencias"));
      const lista: Competencia[] = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          nombre: data.nombre ?? "Sin nombre",
          foto:
            data.foto ??
            
            "https://via.placeholder.com/300x200.png?text=Sin+Imagen",
          fechaInicio:
            data.fechaInicio instanceof Timestamp
              ? data.fechaInicio.toDate()
              : new Date(),
          fechaCierre:
            data.fechaCierre instanceof Timestamp
              ? data.fechaCierre.toDate()
              : new Date(),
          fechaEvento:
            data.fechaEvento instanceof Timestamp
              ? data.fechaEvento.toDate()
              : new Date(),
          fechaCreacion:
            data.fechaCreacion instanceof Timestamp
              ? data.fechaCreacion.toDate()
              : new Date(),
        };
      });

      // 🧠 Ordenar por fechaInicio más cercana a hoy
      const ahora = new Date();
      const proximas = lista
        .filter((c) => c.fechaInicio >= ahora)
        .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime());

      setCompetencias(lista);
      const seleccionada = proximas[0] ?? lista[0] ?? null;
      setCompetenciaSeleccionada(seleccionada);

      if (seleccionada) {
        await cargarJueces(seleccionada.id);
      }

      setLoading(false);
    };

    cargarCompetencias();
  }, []);

  // 🧾 Cargar jueces
  const cargarJueces = async (competenciaId: string) => {
    const juecesRef = collection(db, "competencias", competenciaId, "jueces");
    const snapshot = await getDocs(juecesRef);
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Juez[];
    setJueces(lista);
  };

  // 🔐 Generar contraseña aleatoria
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

  // ➕ AGREGAR JUEZ
  const handleAgregar = async () => {
    if (!competenciaSeleccionada) return;

    const nuevoJuez: Omit<Juez, "id"> = {
      nombre: form.nombre,
      apellidos: form.apellidos,
      usuario: form.usuario,
      password: generarPassword(),
    };

    try {
      const juecesRef = collection(
        db,
        "competencias",
        competenciaSeleccionada.id,
        "jueces"
      );
      const docRef = await addDoc(juecesRef, nuevoJuez);
      setJueces([...jueces, { id: docRef.id, ...nuevoJuez }]);
      setForm({ nombre: "", apellidos: "", usuario: "" });
      setModalAgregar(false);
    } catch (error) {
      console.error("Error al agregar juez:", error);
    }
  };

  // ✏️ EDITAR JUEZ
  const handleEditar = async () => {
    if (!juezSeleccionado || !competenciaSeleccionada) return;
    const juezRef = doc(
      db,
      "competencias",
      competenciaSeleccionada.id,
      "jueces",
      juezSeleccionado.id
    );
    await updateDoc(juezRef, form);
    setJueces(
      jueces.map((j) =>
        j.id === juezSeleccionado.id ? { ...j, ...form } : j
      )
    );
    setModalEditar(false);
    setJuezSeleccionado(null);
  };

  // 🗑️ ELIMINAR JUEZ
  const handleEliminar = async () => {
    if (!juezSeleccionado || !competenciaSeleccionada) return;
    await deleteDoc(
      doc(
        db,
        "competencias",
        competenciaSeleccionada.id,
        "jueces",
        juezSeleccionado.id
      )
    );
    setJueces(jueces.filter((j) => j.id !== juezSeleccionado.id));
    setModalEliminar(false);
    setJuezSeleccionado(null);
  };

  const seleccionarJuez = (juez: Juez, accion: "editar" | "eliminar") => {
    setJuezSeleccionado(juez);
    setForm({
      nombre: juez.nombre,
      apellidos: juez.apellidos,
      usuario: juez.usuario,
    });
    if (accion === "editar") setModalEditar(true);
    else setModalEliminar(true);
  };

  
  if (loading)
    return (
      <div className="modal-carga">
        <div className="modal-caja">
          <img
            src ={Logo}
            alt="Logo"
            className="logo-modal"
          />
          <p>Cargando competencia más cercana...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );

  if (!competenciaSeleccionada)
    return <p>No hay competencias disponibles.</p>;

  const { fechaInicio, fechaCierre, fechaEvento, fechaCreacion } =
    competenciaSeleccionada;

  return (
    <div className="asignar-container">
      <h1>Gestión de Jueces</h1>
      <p>
        Asocia, edita o elimina jueces de la competencia más cercana.
      </p>

      <h2 className="competencia-nombre">{competenciaSeleccionada.nombre}</h2>

      <div className="competencia-fila">
        <div className="competencia-imagen">
          <img
            src={competenciaSeleccionada.foto}
            alt={competenciaSeleccionada.nombre}
          />
        </div>

        <div className="competencia-calendario">
          <Calendar
            selectRange={true}
            value={[fechaInicio, fechaEvento]}
            tileClassName={({ date }) => {
              if (date.toDateString() === fechaCreacion.toDateString())
                return "fecha-creacion";
              if (date.toDateString() === fechaCierre.toDateString())
                return "fecha-cierre";
              if (date >= fechaInicio && date <= fechaEvento)
                return "rango-fechas";
              return null;
            }}
          />
        </div>
      </div>

      <div className="fechas-competencia">
        <p><strong>Creación:</strong> {fechaCreacion.toLocaleDateString("es-ES")}</p>
        <p><strong>Inicio:</strong> {fechaInicio.toLocaleDateString("es-ES")}</p>
        <p><strong>Cierre:</strong> {fechaCierre.toLocaleDateString("es-ES")}</p>
        <p><strong>Evento:</strong> {fechaEvento.toLocaleDateString("es-ES")}</p>
      </div>

      <button className="btn-registrar" onClick={() => setModalAgregar(true)}>
        Agregar Juez
      </button>

      {/* Tabla jueces */}
      <div className="lista-jueces">
        <h3>Jueces Registrados</h3>
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
                    <button
                      className="btn-editar"
                      onClick={() => seleccionarJuez(juez, "editar")}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => seleccionarJuez(juez, "eliminar")}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALES */}
      {(modalAgregar || modalEditar || modalEliminar) && (
        <div className="modal-fondo">
          <div className="modal-contenido">
            {modalAgregar && (
              <>
                <h3>Agregar Juez</h3>
                <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange}/>
                <input name="apellidos" placeholder="Apellidos" value={form.apellidos} onChange={handleChange}/>
                <input name="usuario" placeholder="Usuario" value={form.usuario} onChange={handleChange}/>
                <button onClick={handleAgregar}>Guardar</button>
                <button onClick={() => setModalAgregar(false)}>Cancelar</button>
              </>
            )}

            {modalEditar && (
              <>
                <h3>Editar Juez</h3>
                <input name="nombre" value={form.nombre} onChange={handleChange}/>
                <input name="apellidos" value={form.apellidos} onChange={handleChange}/>
                <input name="usuario" value={form.usuario} onChange={handleChange}/>
                <button onClick={handleEditar}>Guardar Cambios</button>
                <button onClick={() => setModalEditar(false)}>Cancelar</button>
              </>
            )}

            {modalEliminar && (
              <>
                <h3>¿Eliminar este juez?</h3>
                <p>{juezSeleccionado?.nombre} {juezSeleccionado?.apellidos}</p>
                <button onClick={handleEliminar}>Sí, eliminar</button>
                <button onClick={() => setModalEliminar(false)}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignarJueces;
