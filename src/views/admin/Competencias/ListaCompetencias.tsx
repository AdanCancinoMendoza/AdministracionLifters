import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaTrash, FaEdit, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
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

// Configurar icono Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const marcadorIcono = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
});

// Componente para seleccionar ubicación
const LocationMarker = ({
  externalPosition,
  onSelect,
}: {
  externalPosition: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}) => {
  const [position, setPosition] = useState<[number, number] | null>(externalPosition);
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onSelect(lat, lng);
    },
  });

  React.useEffect(() => {
    if (externalPosition) {
      setPosition(externalPosition);
      map.setView(externalPosition, 14);
      onSelect(externalPosition[0], externalPosition[1]);
    }
  }, [externalPosition]);

  return position ? <Marker position={position} /> : null;
};

const ListaCompetencias: React.FC = () => {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [editar, setEditar] = useState<Competencia | null>(null);
  const [search, setSearch] = useState("");
  const [searchPosition, setSearchPosition] = useState<[number, number] | null>(null);

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
      const res = await fetch(`http://localhost:3001/api/competenciasadmin/${id}`, {
        method: "DELETE",
      });
      if (res.ok) cargarCompetencias();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleEditar = (competencia: Competencia) => {
    setEditar(competencia);
    if (competencia.lat && competencia.lng) setSearchPosition([competencia.lat, competencia.lng]);
  };

  const handleCierreModal = () => {
    setEditar(null);
    setSearch("");
    setSearchPosition(null);
    cargarCompetencias();
  };

  const handleChange = (field: keyof Competencia, value: any) => {
    if (!editar) return;
    setEditar({ ...editar, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editar) return;
    if (e.target.files && e.target.files[0]) handleChange("foto", e.target.files[0]);
  };

  const handleSearchUbicacion = async () => {
    if (!search.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setSearchPosition(newPos);
        handleChange("lat", newPos[0]);
        handleChange("lng", newPos[1]);
        handleChange("ubicacion", display_name);
      } else {
        alert("No se encontró la ubicación");
      }
    } catch (error) {
      console.error("Error buscando dirección:", error);
      alert("❌ Error buscando ubicación");
    }
  };

  const handleSubmitEditar = async () => {
    if (!editar) return;
    try {
      const formData = new FormData();
      formData.append("nombre", editar.nombre);
      formData.append("tipo", editar.tipo);
      formData.append("categoria", editar.categoria);
      formData.append("costo", editar.costo.toString());
      formData.append("ubicacion", editar.ubicacion || "");
      formData.append("lat", editar.lat?.toString() || "");
      formData.append("lng", editar.lng?.toString() || "");
      if (editar.fecha_inicio) formData.append("fecha_inicio", new Date(editar.fecha_inicio).toISOString());
      if (editar.fecha_cierre) formData.append("fecha_cierre", new Date(editar.fecha_cierre).toISOString());
      if (editar.fecha_evento) formData.append("fecha_evento", new Date(editar.fecha_evento).toISOString());

      // 👇 Aquí está la clave
      if (editar.foto instanceof File) {
        formData.append("foto", editar.foto);
      } else if (typeof editar.foto === "string" && editar.foto.trim() !== "") {
        formData.append("foto", editar.foto); // Mantiene la foto anterior
      }

      const res = await fetch(`http://localhost:3001/api/competenciasadmin/${editar.id_competencia}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Competencia actualizada");
        handleCierreModal();
      } else {
        alert("❌ Error al actualizar");
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("❌ Error al conectar con el servidor");
    }
  };


  const competenciasFiltradas = competencias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="competencias-dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Competencias Registradas</h1>
        <input
          type="text"
          className="filtro-busqueda"
          placeholder="Buscar competencia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </header>

      <div className="competencias-lista">
        {competenciasFiltradas.map((c) => (
          <div className="competencia-card" key={c.id_competencia}>
            <div className="card-img">
              <img src={c.foto ? `http://localhost:3001${c.foto}` : "/placeholder.jpg"} alt={c.nombre} />
            </div>
            <div className="card-body">
              <h2>{c.nombre}</h2>
              <div className="card-info">
                <p><strong>Tipo:</strong> {c.tipo}</p>
                <p><strong>Categoría:</strong> {c.categoria}</p>
                <p><strong>Costo:</strong> ${c.costo}</p>
              </div>
              <div className="card-fechas">
                <div className="fecha-badge inicio"><FaCalendarAlt /> Inicio: {c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : "-"}</div>
                <div className="fecha-badge cierre"><FaCalendarAlt /> Cierre: {c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleDateString() : "-"}</div>
                <div className="fecha-badge evento"><FaCalendarAlt /> Evento: {c.fecha_evento ? new Date(c.fecha_evento).toLocaleDateString() : "-"}</div>
              </div>

              {c.lat && c.lng && (
                <div className="card-map">
                  <MapContainer center={[c.lat, c.lng]} zoom={13} style={{ width: "100%", height: "180px", borderRadius: "8px" }} scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[c.lat, c.lng]} icon={marcadorIcono}>
                      <Popup>
                        <FaMapMarkerAlt /> {c.nombre} <br />
                        {/* 🟢 CORRECCIÓN: Usar Number() para asegurar que .toFixed() se llama sobre un número */}
                        Lat: {c.lat !== null ? Number(c.lat).toFixed(5) : 'N/A'}, Lng: {c.lng !== null ? Number(c.lng).toFixed(5) : 'N/A'}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              <div className="card-actions">
                <button onClick={() => handleEditar(c)}><FaEdit /> Editar</button>
                <button onClick={() => handleEliminar(c.id_competencia)}><FaTrash /> Eliminar</button>
              </div>
            </div>
          </div>
        ))}

        {competenciasFiltradas.length === 0 && <p className="sin-datos">No hay competencias registradas aún.</p>}
      </div>

      {editar && (
        <div className="modal-editar">
          <div className="modal-content">
            <h2>Editar Competencia</h2>
            <div className="editar-grid">
              <input type="text" placeholder="Nombre" value={editar.nombre} onChange={(e) => handleChange("nombre", e.target.value)} />
              <input type="text" placeholder="Tipo" value={editar.tipo} onChange={(e) => handleChange("tipo", e.target.value)} />
              <input type="number" placeholder="Costo" value={editar.costo} onChange={(e) => handleChange("costo", Number(e.target.value))} />
              <input type="file" onChange={handleFileChange} />
            </div>

            <div className="editar-fechas">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker label="Inicio" value={editar.fecha_inicio ? new Date(editar.fecha_inicio) : null} onChange={(v) => handleChange("fecha_inicio", v?.toISOString() || null)} renderInput={(params) => <input {...params} />} />
                <DatePicker label="Cierre" value={editar.fecha_cierre ? new Date(editar.fecha_cierre) : null} onChange={(v) => handleChange("fecha_cierre", v?.toISOString() || null)} renderInput={(params) => <input {...params} />} />
                <DatePicker label="Evento" value={editar.fecha_evento ? new Date(editar.fecha_evento) : null} onChange={(v) => handleChange("fecha_evento", v?.toISOString() || null)} renderInput={(params) => <input {...params} />} />
              </LocalizationProvider>
            </div>

            <div className="editar-ubicacion">
              <input type="text" placeholder="Buscar ubicación..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <button onClick={handleSearchUbicacion}>Buscar</button>
              <MapContainer center={searchPosition || [0, 0]} zoom={searchPosition ? 14 : 2} style={{ width: "100%", height: "200px", borderRadius: "8px" }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker externalPosition={searchPosition} onSelect={(lat, lng) => { handleChange("lat", lat); handleChange("lng", lng); }} />
              </MapContainer>
            </div>

            <div className="modal-actions">
              <button onClick={handleSubmitEditar}>Guardar</button>
              <button onClick={handleCierreModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaCompetencias;