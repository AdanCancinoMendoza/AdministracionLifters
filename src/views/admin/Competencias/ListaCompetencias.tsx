import React, { useEffect, useState } from "react";
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
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../../firebase";
import "../../../styles/ListaCompetencias.css";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export interface Competencia {
  id?: string;
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

// Icono personalizado para Leaflet
const marcadorIcono = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
});

const ListaCompetencias: React.FC = () => {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"Todas" | "Activa" | "Concluida">("Todas");

  // Escuchar cambios en tiempo real de Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "competencias"), (snapshot) => {
      const lista: Competencia[] = snapshot.docs.map((doc) => {
        const data = doc.data();

        const fechaInicio =
          data.fechaInicio instanceof Timestamp ? data.fechaInicio.toDate() : null;
        const fechaCierre =
          data.fechaCierre instanceof Timestamp ? data.fechaCierre.toDate() : null;
        const fechaEvento =
          data.fechaEvento instanceof Timestamp ? data.fechaEvento.toDate() : null;

        let lat = data.lat;
        let lng = data.lng;

        // Si se almacenó en formato texto
        if (!lat && typeof data.ubicacion === "string" && data.ubicacion.includes("Lat:")) {
          const match = data.ubicacion.match(/Lat:\s*([-0-9.]+),\s*Lng:\s*([-0-9.]+)/);
          if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
          }
        }

        let estado: "Activa" | "Concluida" = "Activa";
        if (fechaEvento && fechaEvento.getTime() < Date.now()) {
          estado = "Concluida";
        }

        const participantes = data.participantes ?? 0;

        return {
          id: doc.id,
          nombre: data.nombre ?? "Sin nombre",
          tipo: data.tipo ?? "Desconocido",
          foto: data.foto ?? "",
          fechaInicio,
          fechaCierre,
          fechaEvento,
          categoria: data.categoria ?? "General",
          costo: data.costo ?? 0,
          ubicacion: data.ubicacion ?? "",
          lat: lat ?? null,
          lng: lng ?? null,
          estado,
          participantes,
        };
      });

      setCompetencias(lista);
    });

    return () => unsub();
  }, []);

  // Búsqueda + filtro
  const competenciasFiltradas = competencias.filter((c) => {
    const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === "Todas" || c.estado === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  const totalParticipantes = competenciasFiltradas.reduce(
    (sum, c) => sum + (c.participantes || 0),
    0
  );

  // Datos para la gráfica (solo si hay registros)
  const chartData =
    competenciasFiltradas.length > 0
      ? {
          labels: competenciasFiltradas.map((c) => c.nombre),
          datasets: [
            {
              label: "Participantes",
              data: competenciasFiltradas.map((c) => c.participantes || 0),
              backgroundColor: "#4e79a7",
              borderRadius: 8,
            },
          ],
        }
      : {
          labels: ["Sin datos"],
          datasets: [
            {
              label: "Participantes",
              data: [0],
              backgroundColor: "#ccc",
            },
          ],
        };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text:
          totalParticipantes > 0
            ? `Total de Participantes: ${totalParticipantes}`
            : "Aún no hay competidores registrados",
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
        {/* Filtros */}
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

        {/* Gráfica */}
        <div className="competencias-grafica">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* 🏁 Lista */}
        <div className="competencias-lista">
          {competenciasFiltradas.map((c) => (
            <div className="competencia-card" key={c.id}>
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
                  <strong>Evento:</strong>{" "}
                  {c.fechaEvento?.toLocaleDateString() ?? "No definida"}
                </p>
                <p className="competencia-card-participantes">
                  {c.participantes > 0
                    ? `${c.participantes} participantes`
                    : "Sin competidores registrados"}
                </p>
                <p><strong>Ubicación:</strong> {c.ubicacion}</p>
                <span
                  className={`competencia-estado competencia-estado-${c.estado.toLowerCase()}`}
                >
                  {c.estado}
                </span>

                {/* Mapa con Leaflet */}
                {c.lat && c.lng && (
                  <div className="competencia-map">
                    <MapContainer
                      center={[c.lat, c.lng]}
                      zoom={13}
                      style={{ width: "100%", height: "200px", borderRadius: "10px" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[c.lat, c.lng]} icon={marcadorIcono}>
                        <Popup>{c.nombre}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
              </div>
            </div>
          ))}

          {competenciasFiltradas.length === 0 && (
            <p className="sin-datos">No hay competencias registradas aún.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListaCompetencias;
