import React, { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import "../../../styles/ListaCompetencias.css";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export interface Competencia {
  nombre: string;
  tipo: string;
  foto: string;
  fechaInicio: Date | null;
  fechaCierre: Date | null;
  fechaEvento: Date | null;
  categoria: string;
  costo: number;
  ubicacion: string;
  lat: number | null;
  lng: number | null;
  estado: "Activa" | "Concluida";
  participantes: number;
}

const ListaCompetencias: React.FC = () => {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"Todas" | "Activa" | "Concluida">("Todas");

  const competencias: Competencia[] = [
    {
      nombre: "Carrera 5K Puebla",
      tipo: "Presencial",
      foto: "https://media.istockphoto.com/id/1135093085/es/foto/discovery-mexico-campeche.jpg?s=612x612&w=0&k=20&c=v6c4Lg2aFZHZP_OrXLmCcozJfp-MXiq_EyKydCpdMvU=",
      fechaInicio: new Date("2025-09-01"),
      fechaCierre: new Date("2025-09-08"),
      fechaEvento: new Date("2025-09-10"),
      categoria: "Deporte",
      costo: 200,
      ubicacion: "Puebla, México",
      lat: 19.0413,
      lng: -98.2062,
      estado: "Activa",
      participantes: 120,
    },
    {
      nombre: "Torneo de Ajedrez Virtual",
      tipo: "Virtual",
      foto: "https://media.istockphoto.com/id/1338780047/es/foto/catedral-de-san-francisco-de-campeche.jpg?s=612x612&w=0&k=20&c=urkZDp4I1gdAIhoDLkfgKRNyXQiC7HTQZyTkF4puNrk=",
      fechaInicio: new Date("2025-08-15"),
      fechaCierre: new Date("2025-08-25"),
      fechaEvento: new Date("2025-08-30"),
      categoria: "Cultura",
      costo: 50,
      ubicacion: "Online",
      lat: null,
      lng: null,
      estado: "Concluida",
      participantes: 45,
    },
    {
      nombre: "Maratón Ciudad de México",
      tipo: "Híbrido",
      foto: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0GbpPLoK9tzdH6DEts33-5h_vCKl3vDzw6w&s",
      fechaInicio: new Date("2025-07-10"),
      fechaCierre: new Date("2025-07-30"),
      fechaEvento: new Date("2025-08-05"),
      categoria: "Deporte",
      costo: 500,
      ubicacion: "CDMX, México",
      lat: 19.4326,
      lng: -99.1332,
      estado: "Concluida",
      participantes: 200,
    },
  ];

  const competenciasFiltradas = competencias.filter((c) => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === "Todas" || c.estado === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  const totalParticipantes = competenciasFiltradas.reduce(
    (sum, c) => sum + c.participantes,
    0
  );

  // Datos para gráfica
  const chartData = {
    labels: competenciasFiltradas.map((c) => c.nombre),
    datasets: [
      {
        label: "Participantes",
        data: competenciasFiltradas.map((c) => c.participantes),
        backgroundColor: ["#4e79a7", "#f28e2b", "#76b7b2", "#e15759"],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Total de Participantes: ${totalParticipantes}`,
        color: "#333",
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      x: { ticks: { color: "#333" } },
      y: { ticks: { color: "#333" } },
    },
  };

  return (
    <div className="competencias-dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Lista de Competencias Registradas</h1>
      </header>

      <div className="dashboard-container">
        {/* Barra de búsqueda y filtros */}
        <div className="competencias-filtros">
          <input
            type="text"
            className="filtro-busqueda"
            placeholder="Buscar competencia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="filtro-estado"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as any)}
          >
            <option value="Todas">Todas</option>
            <option value="Activa">Activas</option>
            <option value="Concluida">Concluidas</option>
          </select>
        </div>

        {/* Gráfica de participantes */}
        <div className="competencias-grafica">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Lista de competencias */}
        <div className="competencias-lista">
          {competenciasFiltradas.map((c, index) => (
            <div className="competencia-card" key={index}>
              <img
                src={c.foto}
                alt={c.nombre}
                className="competencia-card-img"
                loading="lazy"
              />
              <div className="competencia-card-body">
                <h2 className="competencia-card-title">{c.nombre}</h2>
                <p><strong>Tipo:</strong> {c.tipo}</p>
                <p><strong>Categoría:</strong> {c.categoria}</p>
                <p><strong>Costo:</strong> ${c.costo}</p>
                <p>
                  <strong>Fechas:</strong> {c.fechaInicio?.toLocaleDateString()} - {c.fechaCierre?.toLocaleDateString()} <br />
                  <strong>Evento:</strong> {c.fechaEvento?.toLocaleDateString()}
                </p>
                <p className="competencia-card-participantes">
                  👥 {c.participantes} participantes
                </p>
                <p><strong>Ubicación:</strong> {c.ubicacion}</p>
                <span className={`competencia-estado competencia-estado-${c.estado.toLowerCase()}`}>
                  {c.estado}
                </span>

                {c.lat && c.lng && (
                  <div className="competencia-map">
                    <LoadScript googleMapsApiKey="TU_API_KEY_AQUI">
                      <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "200px", borderRadius: "10px" }}
                        center={{ lat: c.lat, lng: c.lng }}
                        zoom={12}
                      >
                        <Marker position={{ lat: c.lat, lng: c.lng }} />
                      </GoogleMap>
                    </LoadScript>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListaCompetencias;
