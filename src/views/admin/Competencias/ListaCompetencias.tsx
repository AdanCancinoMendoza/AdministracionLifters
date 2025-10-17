import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../../../styles/ListaCompetencias.css";

export interface Competencia {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto: string | null;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  fecha_evento: string | null;
  categoria: string;
  costo: number;
  ubicacion: string | null;
  lat: number | null;
  lng: number | null;
}

// Icono personalizado para Leaflet
const marcadorIcono = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
});

const ListaCompetencias: React.FC = () => {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // Cargar datos desde MySQL
  const cargarCompetencias = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/competenciasadmin");
      const data = await res.json();
      setCompetencias(data);
    } catch (error) {
      console.error("Error al cargar competencias:", error);
    }
  };

  useEffect(() => {
    cargarCompetencias();
  }, []);

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta competencia?")) return;
    try {
      const res = await fetch(
        `http://localhost:3001/api/competenciasadmin/${id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        alert("Competencia eliminada correctamente");
        cargarCompetencias();
      } else {
        alert("Error al eliminar la competencia");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleEditar = (id: number) => {
    // Aquí puedes abrir un modal o redirigir a otra vista para editar
    alert(`Editar competencia con ID: ${id}`);
  };

  // Filtrar por búsqueda
  const competenciasFiltradas = competencias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

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
        </div>

        {/* Lista */}
        <div className="competencias-lista">
          {competenciasFiltradas.map((c) => (
            <div className="competencia-card" key={c.id_competencia}>
              {c.foto && (
              <img
                src={c.foto ? `http://localhost:3001${c.foto}` : "/placeholder.jpg"}
                alt={c.nombre}
                className="competencia-card-img"
                loading="lazy"
              />

              )}
              <div className="competencia-card-body">
                <h2 className="competencia-card-title">{c.nombre}</h2>
                <p><strong>Tipo:</strong> {c.tipo}</p>
                <p><strong>Categoría:</strong> {c.categoria}</p>
                <p><strong>Costo:</strong> ${c.costo}</p>
                <p>
                  <strong>Evento:</strong>{" "}
                  {c.fecha_evento ? new Date(c.fecha_evento).toLocaleDateString() : "No definida"}
                </p>
                <p><strong>Ubicación:</strong> {c.ubicacion ?? "No definida"}</p>

                {/* Mapa */}
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

                {/* Botones de acción */}
                <div className="competencia-actions">
                  <button onClick={() => handleEditar(c.id_competencia)}>Editar</button>
                  <button onClick={() => handleEliminar(c.id_competencia)}>Eliminar</button>
                </div>
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
