import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "../../../styles/RegistrarCompetidor.module.css";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

interface Competidor {
  nombre: string;
  apellidos: string;
  peso: number;
  edad: number;
  categoria: string;
  telefono: string;
  correo: string;
  pagado: string;
  comprobante_pago?: File | null;
}

interface Competencia {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto: string | null;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  fecha_evento: string | null;
  categoria: string;
  costo: string;
  ubicacion: string | null;
}

const RegistrarCompetidor: React.FC = () => {
  const [competidor, setCompetidor] = useState<Competidor>({
    nombre: "",
    apellidos: "",
    peso: 0,
    edad: 0,
    categoria: "",
    telefono: "",
    correo: "",
    pagado: "No",
    comprobante_pago: null,
  });

  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState<Competencia | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const categorias = ["Peso Pluma", "Ligero", "Medio", "Pesado", "Superpesado"];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // estado del modal de estado (success / error / info)
  const [status, setStatus] = useState<{
    open: boolean;
    type?: "success" | "error" | "info";
    title?: string;
    message?: string;
  }>({ open: false });

  useEffect(() => {
    const fetchCompetencias = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:3001/api/competenciasadmin");
        const data: Competencia[] = res.data;

        setCompetencias(data);

        // Selecciona competencia más próxima
        const proxima = data
          .filter(c => c.fecha_evento)
          .sort((a, b) => new Date(a.fecha_evento!).getTime() - new Date(b.fecha_evento!).getTime())[0];

        setCompetenciaSeleccionada(proxima || (data.length > 0 ? data[0] : null));
      } catch (error) {
        console.error("Error al obtener competencias:", error);
        setStatus({
          open: true,
          type: "error",
          title: "Error al cargar",
          message: "No se pudieron obtener las competencias del servidor.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCompetencias();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    // convertir a number si corresponde
    if (name === "peso" || name === "edad") {
      const numeric = Number(value);
      setCompetidor(prev => ({ ...prev, [name]: Number.isNaN(numeric) ? 0 : numeric }));
    } else if (name === "pagado") {
      setCompetidor(prev => ({ ...prev, pagado: value }));
    } else {
      setCompetidor(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCompetidor(prev => ({ ...prev, comprobante_pago: file }));
    }
  };

  const handleCompetenciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const competencia = competencias.find(c => c.id_competencia === Number(e.target.value)) || null;
    setCompetenciaSeleccionada(competencia);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competenciaSeleccionada) {
      setStatus({ open: true, type: "error", title: "Falta seleccionar", message: "Selecciona una competencia" });
      return;
    }

    setSubmitting(true);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nombre", competidor.nombre);
      formData.append("apellidos", competidor.apellidos);
      formData.append("peso", competidor.peso.toString());
      formData.append("edad", competidor.edad.toString());
      formData.append("categoria", competidor.categoria);
      formData.append("telefono", competidor.telefono);
      formData.append("correo", competidor.correo);
      formData.append("pagado", competidor.pagado);
      formData.append("id_competencia", competenciaSeleccionada.id_competencia.toString());
      if (competidor.comprobante_pago) {
        formData.append("comprobante_pago", competidor.comprobante_pago);
      }

      const res = await axios.post("http://localhost:3001/api/competidor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // éxito
      setStatus({
        open: true,
        type: "success",
        title: "Registrado",
        message: " Competidor registrado con éxito!",
      });

      // limpiar formulario
      setCompetidor({
        nombre: "",
        apellidos: "",
        peso: 0,
        edad: 0,
        categoria: "",
        telefono: "",
        correo: "",
        pagado: "No",
        comprobante_pago: null,
      });

      // limpiar input file visual
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error al registrar competidor:", error);
      setStatus({
        open: true,
        type: "error",
        title: "Error",
        message: " Error al registrar competidor",
      });
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <LoadingModal
        open={loading || submitting}
        title={submitting ? "Registrando competidor" : undefined}
        message={submitting ? "Registrando en el servidor..." : "Cargando datos..."}
        subMessage={submitting ? "Por favor espera..." : undefined}
      />

      <StatusModal
        open={status.open}
        type={status.type as any}
        title={status.title}
        message={status.message}
        autoClose={true}
        duration={3000}
        onClose={() => setStatus({ open: false })}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Registro de Competidor</h1>
        <p className={styles.subtitle}>Llena todos los campos para registrar un competidor en la competencia</p>
      </header>

      <section className={styles.formSection}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" type="text" name="nombre" value={competidor.nombre} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="apellidos">Apellidos</label>
            <input id="apellidos" type="text" name="apellidos" value={competidor.apellidos} onChange={handleChange} required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="peso">Peso (kg)</label>
            <input id="peso" type="number" name="peso" value={competidor.peso} onChange={handleChange} required min={30} max={300} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="edad">Edad</label>
            <input id="edad" type="number" name="edad" value={competidor.edad} onChange={handleChange} required min={10} max={100} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="categoria">Categoría</label>
            <select id="categoria" name="categoria" value={competidor.categoria} onChange={handleChange} required>
              <option value="">Selecciona</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" type="tel" name="telefono" value={competidor.telefono} onChange={handleChange} required pattern="\d{10}" title="Ingresa un teléfono válido de 10 dígitos" />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" name="correo" value={competidor.correo} onChange={handleChange} required />
          </div>

          <fieldset className={styles.radioGroup}>
            <legend>Pagado:</legend>
            <label>
              <input type="radio" name="pagado" value="Si" checked={competidor.pagado === "Si"} onChange={handleChange} />
              Sí
            </label>
            <label>
              <input type="radio" name="pagado" value="No" checked={competidor.pagado === "No"} onChange={handleChange} />
              No
            </label>
          </fieldset>

          <div className={styles.inputGroup}>
            <label htmlFor="comprobante_pago">Comprobante de pago (opcional)</label>
            <input
              id="comprobante_pago"
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            {competidor.comprobante_pago && <p className={styles.fileName}>Archivo: {competidor.comprobante_pago.name}</p>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="competencia">Competencia</label>
            <select id="competencia" value={competenciaSeleccionada?.id_competencia || ""} onChange={handleCompetenciaChange} required>
              {competencias.map(c => (
                <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {competenciaSeleccionada && (
            <div className={styles.competenciaCard}>
              <img
                src={competenciaSeleccionada.foto ? `http://localhost:3001${competenciaSeleccionada.foto}` : "/placeholder.png"}
                alt={competenciaSeleccionada.nombre}
              />
              <div className={styles.competenciaInfo}>
                <h3>{competenciaSeleccionada.nombre}</h3>
                {competenciaSeleccionada.fecha_inicio && <p>Inicio: {new Date(competenciaSeleccionada.fecha_inicio).toLocaleDateString()}</p>}
                {competenciaSeleccionada.fecha_evento && <p>Evento: {new Date(competenciaSeleccionada.fecha_evento).toLocaleDateString()}</p>}
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default RegistrarCompetidor;
