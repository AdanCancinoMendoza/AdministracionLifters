import React, { useState, useEffect } from "react";
import "../../../styles/RegistrarCompetidor.css";
import { db } from "../../../firebase";
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

interface Competidor {
  nombre: string;
  apellidos: string;
  peso: number;
  edad: number;
  categoria: string;
  telefono: string;
  correo: string;
  pagado: string;
  competenciaId?: string;
}

interface Competencia {
  id: string;
  nombre: string;
  foto: string;
  fechaInicio: Timestamp;
  fechaCierre: Timestamp;
  fechaEvento: Timestamp;
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
  });

  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState<Competencia | null>(null);

  const categorias = ["Peso Pluma", "Ligero", "Medio", "Pesado", "Superpesado"];

  useEffect(() => {
    const fetchCompetencias = async () => {
      const now = Timestamp.now();
      const q = query(
        collection(db, "competencias"),
        where("fechaCierre", ">", now), // Solo pendientes
        orderBy("fechaCierre", "asc")
      );

      const snapshot = await getDocs(q);
      const compPendientes: Competencia[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Competencia));

      setCompetencias(compPendientes);

      // Seleccionar la competencia más cercana por defecto
      if (compPendientes.length > 0) setCompetenciaSeleccionada(compPendientes[0]);
    };

    fetchCompetencias();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompetidor({ ...competidor, [name]: value });
  };

  const handleCompetenciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const competencia = competencias.find(c => c.id === e.target.value) || null;
    setCompetenciaSeleccionada(competencia);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competenciaSeleccionada) {
      alert("Selecciona una competencia");
      return;
    }

    try {
      // Guardar competidor en subcolección de la competencia
      await addDoc(collection(db, `competencias/${competenciaSeleccionada.id}/competidores`), {
        ...competidor,
        competenciaId: competenciaSeleccionada.id,
        fechaRegistro: Timestamp.now(),
      });
      alert("Competidor registrado con éxito!");
      setCompetidor({
        nombre: "",
        apellidos: "",
        peso: 0,
        edad: 0,
        categoria: "",
        telefono: "",
        correo: "",
        pagado: "No",
      });
    } catch (error) {
      console.error("Error al registrar competidor:", error);
      alert("Error al registrar competidor");
    }
  };

  return (
    <div className="horizontal-container">
      <div className="form-card-horizontal">
        <h2>Registro Competidor</h2>

        <form onSubmit={handleSubmit} className="horizontal-form">
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

          {/* Selección de competencia */}
          <div className="form-group-horizontal">
            <label>Competencia</label>
            <select value={competenciaSeleccionada?.id || ""} onChange={handleCompetenciaChange} required>
              {competencias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Mostrar imagen de competencia */}
          {competenciaSeleccionada && (
            <div className="competencia-activa-card">
              <img src={competenciaSeleccionada.foto} alt={competenciaSeleccionada.nombre} />
              <div className="competencia-info">
                <h3>{competenciaSeleccionada.nombre}</h3>
                <p>Inicio: {competenciaSeleccionada.fechaInicio.toDate().toLocaleDateString()}</p>
                <p>Evento: {competenciaSeleccionada.fechaEvento.toDate().toLocaleDateString()}</p>
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
