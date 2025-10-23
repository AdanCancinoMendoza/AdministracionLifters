import React, { useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import styles from "../../../styles/CrearCompetencia.module.css";

// Leaflet
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Configurar ícono Leaflet
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
  onCrear?: () => void;
}

const tipos = ["Presencial", "Virtual", "Híbrido"];
const categorias = ["Deporte", "Culturismo"];

const LocationMarker: React.FC<{
  onSelect: (lat: number, lng: number) => void;
  externalPosition: [number, number] | null;
}> = ({ onSelect, externalPosition }) => {
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
  const [search, setSearch] = useState("");
  const [searchPosition, setSearchPosition] = useState<[number, number] | null>(null);

  const handleChange = (field: keyof Competencia, value: any) => {
    setCompetencia({ ...competencia, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleChange("foto", e.target.files[0]);
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
        const pos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setSearchPosition(pos);
        handleChange("lat", pos[0]);
        handleChange("lng", pos[1]);
        handleChange("ubicacion", display_name);
      } else alert("No se encontró la ubicación");
    } catch (error) {
      console.error(error);
      alert("Error buscando dirección");
    }
  };

  const handleSubmit = () => {
    if (!competencia.nombre || !competencia.tipo || !competencia.categoria) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    alert("Competencia creada correctamente");
    if (onCrear) onCrear();
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Crear Nueva Competencia</h1>
      </header>

      <section className={styles.formSection}>
        <div className={styles.grid}>
          <div className={styles.card}>
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Ej. Maratón CDMX"
              value={competencia.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
            />
          </div>

          <div className={styles.card}>
            <label>Tipo</label>
            <select
              value={competencia.tipo}
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              <option value="">Selecciona...</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`${styles.card} ${styles.uploadCard}`}>
          <label>📷 Subir Foto</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {competencia.foto && <p className={styles.fileName}>{competencia.foto.name}</p>}
        </div>

        <div className={styles.card}>
          <h3>Fechas</h3>
          <div className={styles.grid}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Inicio"
                value={competencia.fechaInicio}
                onChange={(v) => handleChange("fechaInicio", v)}
              />
              <DatePicker
                label="Cierre"
                value={competencia.fechaCierre}
                onChange={(v) => handleChange("fechaCierre", v)}
              />
              <DatePicker
                label="Evento"
                value={competencia.fechaEvento}
                onChange={(v) => handleChange("fechaEvento", v)}
              />
            </LocalizationProvider>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <label>Categoría</label>
            <select
              value={competencia.categoria}
              onChange={(e) => handleChange("categoria", e.target.value)}
            >
              <option value="">Selecciona...</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.card}>
            <label>Costo</label>
            <input
              type="number"
              placeholder="0.00"
              value={competencia.costo}
              onChange={(e) => handleChange("costo", Number(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h3>Ubicación</h3>
          <div className={styles.searchBox}>
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
            className={styles.map}
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
            <p className={styles.ubicacionText}>Ubicación: {competencia.ubicacion}</p>
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={handleSubmit}>Crear Competencia</button>
        </div>
      </section>
    </main>
  );
};

export default CrearCompetencia;
