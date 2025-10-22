import React, { useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import "../../../styles/CrearCompetencia.css";
import ModalCarga from "../../../components/ModalCarga";

// Leaflet
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Configurar ícono para Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

export interface Competencia {
  nombre: string;
  tipo: string;
  foto: File | null;
  fechaInicio: Date | null;
  fechaCierre: Date | null;
  fechaEvento: Date | null;
  categoria: string;
  costo: number;
  ubicacion: string;
  lat: number | null;
  lng: number | null;
}

interface CrearCompetenciaProps {
  onCrear?: () => void; // 🔹 Ahora opcional
}

const tipos = ["Presencial", "Virtual", "Híbrido"];
const categorias = ["Deporte", "Culturismo"];

const LocationMarker = ({
  onSelect,
  externalPosition,
}: {
  onSelect: (lat: number, lng: number) => void;
  externalPosition: [number, number] | null;
}) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
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

const CrearCompetencia: React.FC<CrearCompetenciaProps> = ({ onCrear }) => {
  const [competencia, setCompetencia] = useState<Competencia>({
    nombre: "",
    tipo: "",
    foto: null,
    fechaInicio: null,
    fechaCierre: null,
    fechaEvento: null,
    categoria: "",
    costo: 0,
    ubicacion: "",
    lat: null,
    lng: null,
  });

  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [search, setSearch] = useState("");
  const [searchPosition, setSearchPosition] = useState<[number, number] | null>(null);

  const handleChange = (field: keyof Competencia, value: any) => {
    setCompetencia({ ...competencia, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleChange("foto", e.target.files[0]);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`
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
      alert("❌ Error buscando dirección");
    }
  };

  const handleSubmit = async () => {
    if (!competencia.nombre || !competencia.tipo || !competencia.categoria) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    setCargando(true);
    setProgreso(30);

    try {
      const formData = new FormData();
      formData.append("nombre", competencia.nombre);
      formData.append("tipo", competencia.tipo);
      formData.append("categoria", competencia.categoria);
      formData.append("costo", competencia.costo.toString());
      formData.append("ubicacion", competencia.ubicacion);
      formData.append("lat", competencia.lat?.toString() || "");
      formData.append("lng", competencia.lng?.toString() || "");

      if (competencia.fechaInicio)
        formData.append("fecha_inicio", competencia.fechaInicio.toISOString());
      if (competencia.fechaCierre)
        formData.append("fecha_cierre", competencia.fechaCierre.toISOString());
      if (competencia.fechaEvento)
        formData.append("fecha_evento", competencia.fechaEvento.toISOString());

      if (competencia.foto) formData.append("foto", competencia.foto);

      const res = await fetch("http://localhost:3001/api/competenciasadmin", {
        method: "POST",
        body: formData,
      });

      setProgreso(100);

      if (res.ok) {
        alert("✅ Competencia creada correctamente");
        if (onCrear) onCrear(); // 🔹 solo se llama si existe
      } else {
        alert("❌ Error al guardar la competencia");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="crear-container">
      <h2 className="crear-title">Crear Nueva Competencia</h2>

      <div className="crear-grid">
        <div className="crear-card">
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Ej. Maratón CDMX"
            value={competencia.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
          />
        </div>

        <div className="crear-card">
          <label>Tipo</label>
          <select
            value={competencia.tipo}
            onChange={(e) => handleChange("tipo", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="crear-card upload-card">
        <label>📷 Subir Foto</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {competencia.foto && <p className="file-name">{competencia.foto.name}</p>}
      </div>

      <div className="crear-card">
        <h3>Fechas</h3>
        <div className="crear-grid">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Inicio"
              value={competencia.fechaInicio}
              onChange={(newValue) => handleChange("fechaInicio", newValue)}
            />
            <DatePicker
              label="Cierre"
              value={competencia.fechaCierre}
              onChange={(newValue) => handleChange("fechaCierre", newValue)}
            />
            <DatePicker
              label="Evento"
              value={competencia.fechaEvento}
              onChange={(newValue) => handleChange("fechaEvento", newValue)}
            />
          </LocalizationProvider>
        </div>
      </div>

      <div className="crear-grid">
        <div className="crear-card">
          <label>Categoría</label>
          <select
            value={competencia.categoria}
            onChange={(e) => handleChange("categoria", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="crear-card">
          <label>Costo</label>
          <input
            type="number"
            placeholder="0.00"
            value={competencia.costo}
            onChange={(e) => handleChange("costo", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="crear-card">
        <h3>Selecciona Ubicación</h3>

        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={handleSearch}>Buscar</button>
        </div>

        <MapContainer
          center={[19.4326, -99.1332]}
          zoom={12}
          style={{ height: "400px", width: "100%", marginTop: "10px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            externalPosition={searchPosition}
            onSelect={(lat, lng) => {
              handleChange("lat", lat);
              handleChange("lng", lng);
              handleChange("ubicacion", `Lat: ${lat}, Lng: ${lng}`);
            }}
          />
        </MapContainer>

        {competencia.ubicacion && (
          <p className="ubicacion-text">Ubicación: {competencia.ubicacion}</p>
        )}
      </div>

      <div className="crear-actions">
        <button onClick={handleSubmit}>Crear Competencia</button>
      </div>

      {cargando && <ModalCarga progreso={progreso} />}
    </div>
  );
};

export default CrearCompetencia;
