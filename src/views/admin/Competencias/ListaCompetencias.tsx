// src/views/admin/ListaCompetencias.tsx
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaTrash, FaEdit, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import "../../../styles/ListaCompetencias.css";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

export interface Competencia {
  id_competencia: number;
  nombre: string;
  tipo: string;
  foto: string | File | null;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  fecha_evento: string | null;
  categoria: string;
  costo: number;
  ubicacion: string | null;
  lat: number | null;
  lng: number | null;
  fecha_creacion?: string | null;
}

// Leaflet icon fix
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

// LocationMarker con prevención de loops y tolerancia de cambios
const LocationMarker = ({
  externalPosition,
  onSelect,
}: {
  externalPosition: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    externalPosition
  );
  const map = useMap();

  // prevExternal evita re-notificar si la posición externa no cambió significativamente
  const prevExternalRef = React.useRef<[number, number] | null>(null);

  const isDifferent = (a: [number, number] | null, b: [number, number] | null) => {
    if (!a && !b) return false;
    if (!a || !b) return true;
    const eps = 1e-6;
    return Math.abs(a[0] - b[0]) > eps || Math.abs(a[1] - b[1]) > eps;
  };

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      console.log("LocationMarker: map clicked ->", lat, lng);
      // Actualizamos posición local y notificamos al padre
      setPosition([lat, lng]);
      prevExternalRef.current = [lat, lng]; // sincronizamos prevExternal
      onSelect(lat, lng);
    },
  });

  useEffect(() => {
    if (externalPosition) {
      console.log(
        "LocationMarker: externalPosition changed ->",
        externalPosition,
        "prev:",
        prevExternalRef.current
      );

      // Si es diferente a la anterior externa, actualizamos
      if (isDifferent(externalPosition, prevExternalRef.current)) {
        setPosition(externalPosition);
        try {
          map.setView(externalPosition, 14);
        } catch (err) {}
        // Notificar al padre sólo si la posición externa es distinta (evita loops)
        onSelect(externalPosition[0], externalPosition[1]);
        prevExternalRef.current = externalPosition;
      } else {
        // aún debemos ajustar view si es necesario, pero no re-notificar
        try {
          map.setView(externalPosition, 14);
        } catch (err) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPosition]);

  return position ? <Marker position={position} icon={marcadorIcono} /> : null;
};

const ListaCompetencias: React.FC = () => {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [editar, setEditar] = useState<Competencia | null>(null);
  const [search, setSearch] = useState("");
  const [searchPosition, setSearchPosition] = useState<[number, number] | null>(
    null
  );
  const [loadingModal, setLoadingModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [editingMap, setEditingMap] = useState<L.Map | null>(null);

  // Ref para evitar race conditions al leer el estado en submit
  const editarRef = React.useRef<Competencia | null>(null);
  useEffect(() => {
    editarRef.current = editar;
  }, [editar]);

  const cargarCompetencias = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/competenciasadmin");
      const data = await res.json();

      const norm = (data || []).map((d: any) => ({
        ...d,
        lat:
          d.lat !== undefined && d.lat !== null && d.lat !== ""
            ? parseFloat(String(d.lat))
            : null,
        lng:
          d.lng !== undefined && d.lng !== null && d.lng !== ""
            ? parseFloat(String(d.lng))
            : null,
        costo:
          d.costo !== undefined && d.costo !== null
            ? parseFloat(String(d.costo))
            : 0,
      }));

      setCompetencias(norm);
    } catch (error) {
      console.error("Error al cargar competencias:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudieron cargar las competencias.",
      });
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
        {
          method: "DELETE",
        }
      );
      if (res.ok) cargarCompetencias();
      else
        setStatusModal({
          open: true,
          type: "error",
          title: "Error",
          message: "No se pudo eliminar la competencia.",
        });
    } catch (error) {
      console.error("Error al eliminar:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "Ocurrió un error al eliminar.",
      });
    }
  };

  // Forzamos tipos numéricos al abrir modal
  const handleEditar = (competencia: any) => {
    const latNum =
      competencia.lat !== undefined &&
      competencia.lat !== null &&
      competencia.lat !== ""
        ? Number(competencia.lat)
        : null;
    const lngNum =
      competencia.lng !== undefined &&
      competencia.lng !== null &&
      competencia.lng !== ""
        ? Number(competencia.lng)
        : null;

    const nueva: Competencia = {
      ...competencia,
      lat: isNaN(latNum as number) ? null : latNum,
      lng: isNaN(lngNum as number) ? null : lngNum,
      costo:
        competencia.costo !== undefined && competencia.costo !== null
          ? Number(competencia.costo)
          : 0,
    };

    setEditar(nueva);

    if (latNum !== null && lngNum !== null && !isNaN(latNum) && !isNaN(lngNum)) {
      setSearchPosition([latNum, lngNum]);
    } else {
      setSearchPosition(null);
    }
  };

  const handleCierreModal = () => {
    setEditar(null);
    setSearch("");
    setSearchPosition(null);
    setEditingMap(null);
    cargarCompetencias();
  };

  // Normalizamos lat/lng y otros campos (forma funcional para evitar stale state)
  const handleChange = (field: keyof Competencia, value: any) => {
    setEditar((prev) => {
      if (!prev) return prev;

      if (field === "lat" || field === "lng") {
        // value puede ser number o string
        let parsed: number | null;
        if (value === "" || value === null || value === undefined) parsed = null;
        else {
          parsed = typeof value === "number" ? value : Number(value);
          if (!Number.isFinite(parsed)) parsed = null;
        }

        console.log("handleChange (lat/lng) ->", field, value, "parsed:", parsed);
        return {
          ...prev,
          [field]: parsed,
        } as Competencia;
      }

      console.log("handleChange ->", field, value);
      return { ...prev, [field]: value } as Competencia;
    });
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
        console.log("Nominatim ->", newPos, display_name);
        setSearchPosition(newPos);
        // Estas llamadas usan handleChange (funcional) y actualizarán editar correctamente
        handleChange("lat", newPos[0]);
        handleChange("lng", newPos[1]);
        handleChange("ubicacion", display_name);
      } else {
        setStatusModal({
          open: true,
          type: "error",
          title: "Sin resultados",
          message: "No se encontró la ubicación.",
        });
      }
    } catch (error) {
      console.error("Error buscando dirección:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "Error buscando ubicación.",
      });
    }
  };

  useEffect(() => {
    if (!editingMap) return;
    const t = setTimeout(() => {
      try {
        editingMap.invalidateSize();
        if (searchPosition) {
          editingMap.setView(searchPosition, 14);
        } else if (editar && editar.lat && editar.lng) {
          editingMap.setView([editar.lat, editar.lng], 14);
        }
        if ((editingMap as any).dragging && (editingMap as any).dragging.enable) {
          (editingMap as any).dragging.enable();
        }
      } catch (err) {}
    }, 150);

    return () => clearTimeout(t);
  }, [editingMap, searchPosition, editar]);

  const handleSubmitEditar = async () => {
    const current = editarRef.current;
    if (!current) return;
    setLoadingModal(true);
    try {
      const latVal = current.lat ?? null;
      const lngVal = current.lng ?? null;

      let ubicacionFinal = current.ubicacion ?? "";
      if (latVal !== null && lngVal !== null) {
        ubicacionFinal = `Lat: ${latVal}, Lng: ${lngVal}`;
      }

      const formData = new FormData();
      formData.append("nombre", current.nombre ?? "");
      formData.append("tipo", current.tipo ?? "");
      formData.append("categoria", current.categoria ?? "");
      formData.append(
        "costo",
        current.costo !== undefined && current.costo !== null
          ? String(Number(current.costo))
          : "0"
      );
      formData.append("ubicacion", ubicacionFinal ?? "");
      formData.append("lat", latVal !== null ? String(latVal) : "");
      formData.append("lng", lngVal !== null ? String(lngVal) : "");
      if (current.fecha_inicio)
        formData.append("fecha_inicio", new Date(current.fecha_inicio).toISOString());
      if (current.fecha_cierre)
        formData.append("fecha_cierre", new Date(current.fecha_cierre).toISOString());
      if (current.fecha_evento)
        formData.append("fecha_evento", new Date(current.fecha_evento).toISOString());
      if (current.foto instanceof File) formData.append("foto", current.foto);

      // DEBUG: ver qué se envía en FormData
      for (const pair of (formData as any).entries()) {
        console.log("formData:", pair[0], pair[1]);
      }

      const res = await fetch(
        `http://localhost:3001/api/competenciasadmin/${current.id_competencia}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (res.ok) {
        setStatusModal({
          open: true,
          type: "success",
          title: "Competencia actualizada",
          message: "La competencia fue actualizada correctamente.",
        });
        handleCierreModal();
      } else {
        const body = await res.json().catch(() => null);
        setStatusModal({
          open: true,
          type: "error",
          title: "Error",
          message: body?.error || "No se pudo actualizar la competencia.",
        });
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "Ocurrió un error al conectar con el servidor.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const competenciasFiltradas = competencias.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="competencias-dashboard">
      <LoadingModal open={loadingModal} />
      <StatusModal
        open={statusModal.open}
        type={statusModal.type as any}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, open: false })}
      />

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
              <img
                src={c.foto ? `http://localhost:3001${String(c.foto)}` : "/placeholder.jpg"}
                alt={c.nombre}
              />
            </div>
            <div className="card-body">
              <h2>{c.nombre}</h2>
              <div className="card-info">
                <p><strong>Tipo:</strong> {c.tipo}</p>
                <p><strong>Categoría:</strong> {c.categoria}</p>
                <p><strong>Costo:</strong> ${c.costo}</p>
              </div>
              <div className="card-fechas">
                <div className="fecha-badge inicio">
                  <FaCalendarAlt /> Inicio: {c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : "-"}
                </div>
                <div className="fecha-badge cierre">
                  <FaCalendarAlt /> Cierre: {c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleDateString() : "-"}
                </div>
                <div className="fecha-badge evento">
                  <FaCalendarAlt /> Evento: {c.fecha_evento ? new Date(c.fecha_evento).toLocaleDateString() : "-"}
                </div>
              </div>

              {c.lat !== null && c.lng !== null && (
                <div className="card-map">
                  <MapContainer
                    center={[c.lat as number, c.lng as number]}
                    zoom={13}
                    style={{ width: "100%", height: "180px", borderRadius: "8px" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[c.lat as number, c.lng as number]} icon={marcadorIcono}>
                      <Popup>
                        <FaMapMarkerAlt /> {c.nombre} <br />
                        Lat: {Number(c.lat).toFixed(5)}, Lng: {Number(c.lng).toFixed(5)}
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

        {competenciasFiltradas.length === 0 && (
          <p className="sin-datos">No hay competencias registradas aún.</p>
        )}
      </div>

      {editar && (
        <div
          className="modal-editar"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 1000,
            pointerEvents: "auto",
          }}
        >
          <div
            className="modal-content"
            style={{
              width: "92%",
              maxWidth: 920,
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              pointerEvents: "auto",
            }}
          >
            <h2>Editar Competencia</h2>

            <div className="editar-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input type="text" placeholder="Nombre" value={editar.nombre} onChange={(e) => handleChange("nombre", e.target.value)} />
              <input type="text" placeholder="Tipo" value={editar.tipo} onChange={(e) => handleChange("tipo", e.target.value)} />
              <input type="number" placeholder="Costo" value={editar.costo} onChange={(e) => handleChange("costo", Number(e.target.value))} />
              <input type="file" onChange={handleFileChange} />
            </div>

            <div className="editar-fechas" style={{ marginTop: 12, display: "flex", gap: 12 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker label="Inicio" value={editar.fecha_inicio ? new Date(editar.fecha_inicio) : null} onChange={(v) => handleChange("fecha_inicio", v ? v.toISOString() : null)} />
                <DatePicker label="Cierre" value={editar.fecha_cierre ? new Date(editar.fecha_cierre) : null} onChange={(v) => handleChange("fecha_cierre", v ? v.toISOString() : null)} />
                <DatePicker label="Evento" value={editar.fecha_evento ? new Date(editar.fecha_evento) : null} onChange={(v) => handleChange("fecha_evento", v ? v.toISOString() : null)} />
              </LocalizationProvider>
            </div>

            <div className="editar-ubicacion" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" placeholder="Buscar ubicación..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
                <button onClick={handleSearchUbicacion}>Buscar</button>
              </div>

              {/* Inputs manuales para lat/lng (útiles si el mapa no setea correctamente) */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitud (ej. 19.333986415340995)"
                  value={editar.lat ?? ""}
                  onChange={(e) => handleChange("lat", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitud (ej. -97.41107225418091)"
                  value={editar.lng ?? ""}
                  onChange={(e) => handleChange("lng", e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => {
                    // Convertir a number por si el usuario escribió en el input (podría ser string)
                    const latNumRaw = editar?.lat;
                    const lngNumRaw = editar?.lng;
                    const latNum = latNumRaw !== null && latNumRaw !== undefined ? Number(latNumRaw) : null;
                    const lngNum = lngNumRaw !== null && lngNumRaw !== undefined ? Number(lngNumRaw) : null;

                    if (
                      latNum !== null &&
                      lngNum !== null &&
                      Number.isFinite(latNum) &&
                      Number.isFinite(lngNum)
                    ) {
                      // usamos forma funcional
                      setEditar(prev => prev ? { ...prev, lat: latNum, lng: lngNum } : prev);
                      setSearchPosition([latNum, lngNum]);
                      if (editingMap) editingMap.setView([latNum, lngNum], 14);
                      console.log("Manual coords applied ->", latNum, lngNum);
                    } else {
                      setStatusModal({
                        open: true,
                        type: "error",
                        title: "Coords inválidas",
                        message: "Latitud o longitud inválida.",
                      });
                    }
                  }}
                >
                  Aplicar
                </button>
              </div>

              <MapContainer
                center={
                  searchPosition ||
                  (editar.lat && editar.lng ? [editar.lat, editar.lng] : [0, 0])
                }
                zoom={searchPosition || (editar.lat && editar.lng) ? 14 : 2}
                style={{ width: "100%", height: "300px", borderRadius: "8px" }}
                whenCreated={(mapInstance: L.Map) => setEditingMap(mapInstance)}
              >
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker
                  externalPosition={
                    searchPosition || (editar.lat && editar.lng ? [editar.lat, editar.lng] : null)
                  }
                  onSelect={(lat, lng) => {
                    // handleChange usa la forma funcional y mantiene coherencia
                    handleChange("lat", lat);
                    handleChange("lng", lng);
                    handleChange("ubicacion", `Lat: ${lat}, Lng: ${lng}`);
                    setSearch(`Lat: ${lat}, Lng: ${lng}`);
                    setSearchPosition([lat, lng]);
                    console.log("onSelect set ->", lat, lng);
                  }}
                />

                {(searchPosition || (editar.lat && editar.lng)) && (
                  <Marker
                    position={
                      searchPosition ||
                      (editar.lat && editar.lng ? ([editar.lat, editar.lng] as [number, number]) : undefined as any)
                    }
                    icon={marcadorIcono}
                  >
                    <Popup>
                      {editar.nombre} <br />
                      Lat: {Number(editar.lat ?? (searchPosition && searchPosition[0]) ?? 0).toFixed(6)}, Lng:{" "}
                      {Number(editar.lng ?? (searchPosition && searchPosition[1]) ?? 0).toFixed(6)}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <div className="modal-actions" style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
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
