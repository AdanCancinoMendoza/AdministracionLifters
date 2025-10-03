import React, { useState, useEffect } from "react";
import "../../../styles/RegistrarCompetidor.css";

interface Competidor {
  nombre: string;
  apellidos: string;
  peso: number;
  edad: number;
  categoria: string;
  telefono: string;
  correo: string;
  pagado: string;
}

interface Competencia {
  nombre: string;
  imagen: string; // URL de la imagen de la competencia
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

  const [competenciaActiva, setCompetenciaActiva] = useState<Competencia | null>(null);

  const categorias = ["Peso Pluma", "Ligero", "Medio", "Pesado", "Superpesado"];

  useEffect(() => {
    const competenciaDelDia: Competencia = {
      nombre: "Campeonato Nacional de Powerlifting",
      imagen: "https://escapadas.mexicodesconocido.com.mx/wp-content/uploads/2024/01/Puebla-Ciudad-visitmexico.jpg",
    };
    setCompetenciaActiva(competenciaDelDia);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompetidor({ ...competidor, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Competidor registrado:", competidor);
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
  };

  return (
    <div className="horizontal-container">
      <div className="form-card-horizontal">
        <h2>Registro Competidor</h2>

        <form onSubmit={handleSubmit} className="horizontal-form">
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
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group-horizontal">
            <label>Teléfono</label>
            <input type="tel" name="telefono" value={competidor.telefono} onChange={handleChange} required placeholder="10 dígitos" pattern="\d{10}" />
          </div>

          <div className="form-group-horizontal">
            <label>Correo</label>
            <input type="email" name="correo" value={competidor.correo} onChange={handleChange} required placeholder="correo@ejemplo.com" />
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

          {/* Sección Competencia debajo de Pagado */}
          {competenciaActiva && (
            <div className="competencia-activa-card">
              <img src={competenciaActiva.imagen} alt={competenciaActiva.nombre} />
              <div className="competencia-info">
                <h3>{competenciaActiva.nombre}</h3>
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
