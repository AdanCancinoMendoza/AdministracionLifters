import React, { useState, useEffect } from "react";
import "../../../styles/RegistrarCompetidor.css";
import axios from "axios";

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

  const categorias = ["Peso Pluma", "Ligero", "Medio", "Pesado", "Superpesado"];

  useEffect(() => {
    const fetchCompetencias = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/competenciasadmin");
        const data: Competencia[] = res.data;

        setCompetencias(data);

        // Seleccionar competencia más próxima
        const ahora = new Date();
        const proxima = data
          .filter(c => c.fecha_evento)
          .sort((a, b) => new Date(a.fecha_evento!).getTime() - new Date(b.fecha_evento!).getTime())[0];

        setCompetenciaSeleccionada(proxima || (data.length > 0 ? data[0] : null));
      } catch (error) {
        console.error("Error al obtener competencias:", error);
      }
    };
    fetchCompetencias();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompetidor({ ...competidor, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCompetidor({ ...competidor, comprobante_pago: e.target.files[0] });
    }
  };

  const handleCompetenciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const competencia = competencias.find(c => c.id_competencia === Number(e.target.value)) || null;
    setCompetenciaSeleccionada(competencia);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!competenciaSeleccionada) {
      alert("Selecciona una competencia");
      return;
    }

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

      await axios.post("http://localhost:3001/api/competidor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Competidor registrado con éxito!");

      // Limpiar formulario
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
    } catch (error) {
      console.error("❌ Error al registrar competidor:", error);
      alert("Error al registrar competidor");
    }
  };

  return (
    <div className="horizontal-container">
      <div className="form-card-horizontal">
        <h2>Registro Competidor</h2>

        <form onSubmit={handleSubmit} className="horizontal-form" encType="multipart/form-data">
          {/* Campos del competidor */}
          <div className="form-group-horizontal">
            <label>Nombre</label>
            <input type="text" name="nombre" value={competidor.nombre} onChange={handleChange} required />
          </div>

          <div className="form-group-horizontal">
            <label>Apellidos</label>
            <input type="text" name="apellidos" value={competidor.apellidos} onChange={handleChange} required />
          </div>

          <div className="form-group-horizontal">
            <label>Peso (kg)</label>
            <input type="number" name="peso" value={competidor.peso} onChange={handleChange} required min={30} max={300} />
          </div>

          <div className="form-group-horizontal">
            <label>Edad</label>
            <input type="number" name="edad" value={competidor.edad} onChange={handleChange} required min={10} max={100} />
          </div>

          <div className="form-group-horizontal">
            <label>Categoría</label>
            <select name="categoria" value={competidor.categoria} onChange={handleChange} required>
              <option value="">Selecciona</option>
              {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="form-group-horizontal">
            <label>Teléfono</label>
            <input type="tel" name="telefono" value={competidor.telefono} onChange={handleChange} required pattern="\d{10}" />
          </div>

          <div className="form-group-horizontal">
            <label>Correo</label>
            <input type="email" name="correo" value={competidor.correo} onChange={handleChange} required />
          </div>

          <div className="form-group-horizontal radio-group-horizontal">
            <span>Pagado:</span>
            <label>
              <input type="radio" name="pagado" value="Si" checked={competidor.pagado === "Si"} onChange={handleChange} />
              Sí
            </label>
            <label>
              <input type="radio" name="pagado" value="No" checked={competidor.pagado === "No"} onChange={handleChange} />
              No
            </label>
          </div>

          {/* Comprobante de pago */}
          <div className="form-group-horizontal">
            <label>Comprobante de pago (opcional)</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
          </div>

          {/* Selección de competencia */}
          <div className="form-group-horizontal">
            <label>Competencia</label>
            <select value={competenciaSeleccionada?.id_competencia || ""} onChange={handleCompetenciaChange} required>
              {competencias.map(c => (
                <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Mostrar imagen de competencia */}
          {competenciaSeleccionada && (
            <div className="competencia-activa-card">
              <img
                src={competenciaSeleccionada.foto ? `http://localhost:3001${competenciaSeleccionada.foto}` : "/placeholder.png"}
                alt={competenciaSeleccionada.nombre}
              />
              <div className="competencia-info">
                <h3>{competenciaSeleccionada.nombre}</h3>
                {competenciaSeleccionada.fecha_inicio && <p>Inicio: {new Date(competenciaSeleccionada.fecha_inicio).toLocaleDateString()}</p>}
                {competenciaSeleccionada.fecha_evento && <p>Evento: {new Date(competenciaSeleccionada.fecha_evento).toLocaleDateString()}</p>}
              </div>
            </div>
          )}

          <button type="submit" className="submit-btn-horizontal">Registrar</button>
        </form>
      </div>
    </div>
  );
};

export default RegistrarCompetidor;
