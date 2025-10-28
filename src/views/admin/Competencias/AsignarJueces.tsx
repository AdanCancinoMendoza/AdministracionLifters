import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "../../../styles/AsignarJueces.module.css";
import axios from "axios";

// Importar modales
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

interface Competencia {
  id_competencia: number;
  nombre: string;
  foto: string | null;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  fecha_evento: string | null;
  fecha_creacion: string;
}

interface Juez {
  id: number;
  nombre: string;
  apellidos: string;
  usuario: string;
  password: string;
}

const AsignarJueces: React.FC = () => {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState<Competencia | null>(null);
  const [jueces, setJueces] = useState<Juez[]>([]);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellidos: "", usuario: "", password: "" });
  const [juezSeleccionado, setJuezSeleccionado] = useState<Juez | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para los modales de carga y estatus
  const [loadingModal, setLoadingModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "info" as "success" | "error" | "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    const cargarCompetencias = async () => {
      try {
        const { data } = await axios.get("/api/competenciasadmin");
        const hoy = new Date();
        const pendientes = data.filter(
          (c: Competencia) => c.fecha_evento && new Date(c.fecha_evento) >= hoy
        );
        setCompetencias(pendientes);
        const seleccionada = pendientes[0] ?? null;
        setCompetenciaSeleccionada(seleccionada);
        if (seleccionada) await cargarJueces(seleccionada.id_competencia);
      } catch (error) {
        console.error("Error cargando competencias:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarCompetencias();
  }, []);

  const handleSeleccionarCompetencia = async (id: number) => {
    const seleccionada = competencias.find(c => c.id_competencia === id) || null;
    setCompetenciaSeleccionada(seleccionada);
    if (seleccionada) await cargarJueces(seleccionada.id_competencia);
  };

  const cargarJueces = async (competenciaId: number) => {
    try {
      const { data } = await axios.get("http://localhost:3001/api/juez");
      const filtrados = data
        .filter((j: any) => Number(j.id_competencia) === Number(competenciaId))
        .map((j: any) => ({
          id: j.id_juez,
          nombre: j.nombre,
          apellidos: j.apellidos,
          usuario: j.usuario,
          password: j.password,
        }));
      setJueces(filtrados);
    } catch (error) {
      console.error("Error cargando jueces:", error);
      setJueces([]);
    }
  };

  const generarPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAgregar = async () => {
    if (!competenciaSeleccionada) return;
    setLoadingModal(true);
    try {
      const nuevoJuez = {
        id_competencia: competenciaSeleccionada.id_competencia,
        nombre: form.nombre,
        apellidos: form.apellidos,
        usuario: form.usuario,
        password: generarPassword(),
      };
      const { data } = await axios.post("http://localhost:3001/api/juez", nuevoJuez);
      setJueces([
        ...jueces,
        {
          id: data.id_juez,
          nombre: data.nombre,
          apellidos: data.apellidos,
          usuario: data.usuario,
          password: data.password,
        },
      ]);
      setForm({ nombre: "", apellidos: "", usuario: "", password: "" });
      setModalAgregar(false);
      setStatusModal({
        open: true,
        type: "success",
        title: "Juez agregado",
        message: "El juez fue agregado correctamente.",
      });
    } catch (error) {
      console.error("Error agregando juez:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudo agregar el juez.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleEditar = async () => {
    if (!juezSeleccionado) return;
    setLoadingModal(true);
    try {
      await axios.put(`http://localhost:3001/api/juez/${juezSeleccionado.id}`, form);
      setJueces(jueces.map(j => (j.id === juezSeleccionado.id ? { ...j, ...form } : j)));
      setModalEditar(false);
      setJuezSeleccionado(null);
      setStatusModal({
        open: true,
        type: "success",
        title: "Juez actualizado",
        message: "Los datos del juez se guardaron correctamente.",
      });
    } catch (error) {
      console.error("Error editando juez:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudo actualizar el juez.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleEliminar = async () => {
    if (!juezSeleccionado) return;
    setLoadingModal(true);
    try {
      await axios.delete(`http://localhost:3001/api/juez/${juezSeleccionado.id}`);
      setJueces(jueces.filter(j => j.id !== juezSeleccionado.id));
      setModalEliminar(false);
      setJuezSeleccionado(null);
      setStatusModal({
        open: true,
        type: "success",
        title: "Juez eliminado",
        message: "El juez fue eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error eliminando juez:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudo eliminar el juez.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const seleccionarJuez = (j: Juez, accion: "editar" | "eliminar") => {
    setJuezSeleccionado(j);
    setForm({ nombre: j.nombre, apellidos: j.apellidos, usuario: j.usuario, password: j.password });
    accion === "editar" ? setModalEditar(true) : setModalEliminar(true);
  };

  if (loading)
    return (
      <LoadingModal
        open={true}
        title="Cargando datos"
        message="Cargando competencias pendientes..."
        subMessage="Por favor espere"
      />
    );

  if (!competenciaSeleccionada) return <p>No hay competencias pendientes.</p>;

  return (
    <div className={styles.container}>
      <header>
        <h1 className={styles.titulo}>Gestión de Jueces</h1>
      </header>

      <section className={styles.competenciaSelect}>
        <label>Seleccionar competencia:</label>
        <select
          value={competenciaSeleccionada.id_competencia}
          onChange={(e) => handleSeleccionarCompetencia(Number(e.target.value))}
        >
          {competencias.map((c) => (
            <option key={c.id_competencia} value={c.id_competencia}>
              {c.nombre} ({new Date(c.fecha_evento!).toLocaleDateString()})
            </option>
          ))}
        </select>
      </section>

      <section className={styles.competenciaFila}>
        <div className={styles.competenciaImagen}>
          <img
            src={
              competenciaSeleccionada.foto
                ? `http://localhost:3001${competenciaSeleccionada.foto}`
                : "http://via.placeholder.com/300x200.png?text=Sin+Imagen"
            }
            alt={competenciaSeleccionada.nombre}
          />
        </div>
        <div className={styles.competenciaCalendario}>
          <Calendar
            selectRange
            value={[
              competenciaSeleccionada.fecha_inicio
                ? new Date(competenciaSeleccionada.fecha_inicio)
                : new Date(),
              competenciaSeleccionada.fecha_evento
                ? new Date(competenciaSeleccionada.fecha_evento)
                : new Date(),
            ]}
          />
        </div>
      </section>

      <button className={styles.btnRegistrar} onClick={() => setModalAgregar(true)}>
        Agregar Juez
      </button>

      <section className={styles.listaJueces}>
        <h3>Jueces Registrados</h3>
        {jueces.length === 0 ? (
          <p>No hay jueces registrados.</p>
        ) : (
          <table className={styles.tablaJueces}>
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
              {jueces.map((j) => (
                <tr key={j.id}>
                  <td>{j.nombre}</td>
                  <td>{j.apellidos}</td>
                  <td>{j.usuario}</td>
                  <td>{j.password}</td>
                  <td>
                    <button className={styles.btnEditar} onClick={() => seleccionarJuez(j, "editar")}>
                      Editar
                    </button>
                    <button className={styles.btnEliminar} onClick={() => seleccionarJuez(j, "eliminar")}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {(modalAgregar || modalEditar || modalEliminar) && (
        <div className={styles.modalFondo}>
          <div className={styles.modalContenido}>
            {modalAgregar && (
              <>
                <h3>Agregar Juez</h3>
                <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
                <input name="apellidos" placeholder="Apellidos" value={form.apellidos} onChange={handleChange} />
                <input name="usuario" placeholder="Usuario" value={form.usuario} onChange={handleChange} />
                <button onClick={handleAgregar}>Guardar</button>
                <button onClick={() => setModalAgregar(false)}>Cancelar</button>
              </>
            )}

            {modalEditar && (
              <>
                <h3>Editar Juez</h3>
                <input name="nombre" value={form.nombre} onChange={handleChange} />
                <input name="apellidos" value={form.apellidos} onChange={handleChange} />
                <input name="usuario" value={form.usuario} onChange={handleChange} />
                <button onClick={handleEditar}>Guardar Cambios</button>
                <button onClick={() => setModalEditar(false)}>Cancelar</button>
              </>
            )}

            {modalEliminar && (
              <>
                <h3>¿Eliminar este juez?</h3>
                <p>
                  {juezSeleccionado?.nombre} {juezSeleccionado?.apellidos}
                </p>
                <button onClick={handleEliminar}>Sí, eliminar</button>
                <button onClick={() => setModalEliminar(false)}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modales globales */}
      <LoadingModal
        open={loadingModal}
        title="Procesando solicitud"
        message="Por favor espere..."
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, open: false })}
      />
    </div>
  );
};

export default AsignarJueces;
