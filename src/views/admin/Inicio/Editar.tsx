import React, { useRef, useState, useEffect } from "react";
import "../../../styles/editarInicio.css";
import { FaEdit, FaCheckCircle } from "react-icons/fa";

export default function Editar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [texto, setTexto] = useState(""); // Texto de bienvenida
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos desde backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inicio"); // Proxy Vite
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();

        setTexto(data.Descripcion || "");

        if (imgRef.current) {
          // 🔹 Si la URL de la imagen es relativa, la convertimos en absoluta
          const url = data.Imagen?.startsWith("http")
            ? data.Imagen
            : data.Imagen
            ? `http://localhost:3001${data.Imagen}`
            : "https://assets.worldgym.com/media/38_e605e5d776.png";
          imgRef.current.src = url;
        }
      } catch (err) {
        console.error("Error cargando datos desde backend:", err);
        alert("❌ Error cargando datos del servidor");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Abrir selector de archivo
  const handleEditImage = () => {
    fileInputRef.current?.click();
  };

  // Cambiar imagen localmente
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    if (imgRef.current) imgRef.current.src = url;
  };

  // Guardar cambios en backend
  const handleGuardar = async () => {
    if (guardando) return;
    setGuardando(true);

    try {
      const formData = new FormData();
      formData.append("texto", texto);
      if (selectedFile) formData.append("imagen", selectedFile);

      const res = await fetch("/api/inicio", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        let data;
        try {
          data = await res.json();
        } catch {
          data = { message: res.statusText || "Error desconocido" };
        }
        throw new Error(data.message || "Error al guardar");
      }

      const data = await res.json();
      alert("✅ Cambios guardados correctamente");

      // Limpiar selección de archivo
      setSelectedFile(null);

      // 🔹 Actualizar imagen si cambió y convertir URL si es relativa
      if (data.imagenUrl && imgRef.current) {
        const url = data.imagenUrl.startsWith("http")
          ? data.imagenUrl
          : `http://localhost:3001${data.imagenUrl}`;
        imgRef.current.src = url;
      }
    } catch (error: any) {
      console.error("Error guardando datos:", error);
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="page-content">
      <h1 className="titulo-panel">Panel de Inicio</h1>
      <hr className="borde-separacion" />
      <p className="descripcion-panel">
        En esta sección podrás editar parámetros del inicio
      </p>

      <div className="CambiarImagenTexto_Bienvenida borde-separacion">
        <h2>Cambiar imagen y texto de Inicio</h2>

        <div className="ContenedorImagenTexto">
          {/* Bloque imagen */}
          <div className="IMagen_Bienvenida_Cambiar">
            <img ref={imgRef} alt="Imagen de inicio" />
            <button className="btn-editar" type="button" onClick={handleEditImage}>
              <FaEdit /> Editar Imagen
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>

          {/* Bloque texto */}
          <div className="Texto_Bienvenida_Cambiar">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe el texto de bienvenida aquí..."
            />
            <button
              className="btn-guardar"
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
            >
              <FaCheckCircle /> {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
