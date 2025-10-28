import React, { useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import styles from "../../../styles/CrearCompetencia.module.css";
import axios from "axios";

// Leaflet
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Modales reutilizables
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

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

  // Estados de modales
  const [loadingModal, setLoadingModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "info" as "success" | "error" | "info",
    title: "",
    message: "",
  });

  const handleChange = (field: keyof Competencia, value: any) => {
    setCompetencia((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleChange("foto", e.target.files[0]);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;

    setLoadingModal(true);
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

        setStatusModal({
          open: true,
          type: "success",
          title: "Ubicación encontrada",
          message: "La dirección fue localizada correctamente.",
        });
      } else {
        setStatusModal({
          open: true,
          type: "error",
          title: "Sin resultados",
          message: "No se encontró la ubicación solicitada.",
        });
      }
    } catch (error) {
      console.error(error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "Ocurrió un error al buscar la dirección.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!competencia.nombre || !competencia.tipo || !competencia.categoria) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Campos incompletos",
        message: "Por favor completa los campos obligatorios.",
      });
      return;
    }

    setLoadingModal(true);

    try {
      const formData = new FormData();

      // Campos simples
      formData.append("nombre", competencia.nombre);
      formData.append("tipo", competencia.tipo);
      formData.append("categoria", competencia.categoria);
      formData.append("costo", String(competencia.costo ?? 0));
      formData.append("ubicacion", competencia.ubicacion ?? "");

      // Lat / Lng (si existen)
      if (competencia.lat !== null && competencia.lat !== undefined) {
        formData.append("lat", String(competencia.lat));
      }
      if (competencia.lng !== null && competencia.lng !== undefined) {
        formData.append("lng", String(competencia.lng));
      }

      // Fechas en formato ISO o cadena vacía
      if (competencia.fechaInicio) formData.append("fecha_inicio", competencia.fechaInicio.toISOString());
      else formData.append("fecha_inicio", "");
      if (competencia.fechaCierre) formData.append("fecha_cierre", competencia.fechaCierre.toISOString());
      else formData.append("fecha_cierre", "");
      if (competencia.fechaEvento) formData.append("fecha_evento", competencia.fechaEvento.toISOString());
      else formData.append("fecha_evento", "");

      // Archivo (campo 'foto' que espera multer)
      if (competencia.foto instanceof File) {
        formData.append("foto", competencia.foto);
      }

      // Enviar al backend. Ajusta la URL si es otra.
      const response = await axios.post("/api/competenciasadmin", formData, {
        // No fijes Content-Type: axios lo pone automáticamente para FormData
        timeout: 20000,
      });

      // Respuesta esperada: { message: "Competencia creada correctamente", id }
      const data = response.data;

      setStatusModal({
        open: true,
        type: "success",
        title: "Competencia creada",
        message: data?.message || "La competencia fue creada correctamente.",
      });

      // Llamar callback para que el padre recargue listas o cambie de vista
      if (onCrear) onCrear();

      // Limpiar formulario
      setCompetencia({
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
      setSearch("");
      setSearchPosition(null);
    } catch (error: any) {
      console.error("Error guardando competencia:", error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo crear la competencia.";
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: msg,
      });
    } finally {
      setLoadingModal(false);
    }
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
          <label>Subir Foto</label>
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

          <MapContainer center={[19.4326, -99.1332]} zoom={12} className={styles.map}>
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

      {/* Modales globales */}
      <LoadingModal open={loadingModal} title="Procesando solicitud" message="Por favor espere..." />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, open: false })}
      />
    </main>
  );
};

export default CrearCompetencia;
