import { useState } from "react";
import {
  FaSave,
  FaImage,
  FaVideo,
  FaYoutube,
  FaTimes,
} from "react-icons/fa";
import "../../../styles/CrearInforme.css";

type TipoContenido = "imagen" | "video" | "youtube";

interface Publicacion {
  id: number;
  tipo: TipoContenido;
  contenido: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha: string;
}

interface CrearInformeProps {
  onGuardar: (pub: Publicacion) => void;
  onCerrar: () => void;
}

const CrearInforme: React.FC<CrearInformeProps> = ({ onGuardar, onCerrar }) => {
  const [formData, setFormData] = useState<Publicacion>({
    id: 0,
    tipo: "imagen",
    contenido: "",
    titulo: "",
    descripcion: "",
    categoria: "Noticia",
    fecha: "",
  });

  const [contenidoFile, setContenidoFile] = useState<File | null>(null);

  // 🔧 Manejar cambios
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files } = e.target as any;

    if (name === "contenido" && files && files.length > 0) {
      const file = files[0];
      setContenidoFile(file);
      const tipo: TipoContenido = file.type.includes("video")
        ? "video"
        : "imagen";
      setFormData({ ...formData, contenido: URL.createObjectURL(file), tipo });
    } else if (name === "contenido" && formData.tipo === "youtube") {
      const url = value.trim();
      const videoId = extractYouTubeId(url);
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        setFormData({ ...formData, contenido: embedUrl });
      } else {
        // No mostrar error, solo limpiar el contenido
        setFormData({ ...formData, contenido: "" });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 🎥 Obtener el ID del video de YouTube
  const extractYouTubeId = (url: string): string | null => {
    const match =
      url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  // 💾 Enviar datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("Tipo", formData.tipo);
      formDataToSend.append("Titulo", formData.titulo);
      formDataToSend.append("Descripcion", formData.descripcion);
      formDataToSend.append("Categoria", formData.categoria);
      formDataToSend.append("Fecha", formData.fecha);

      if (formData.tipo !== "youtube" && contenidoFile) {
        formDataToSend.append("Contenido", contenidoFile);
      } else {
        formDataToSend.append("Contenido", formData.contenido);
      }

      const response = await fetch("http://localhost:3001/api/publicacion", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Error al guardar publicación");

      const result = await response.json();
      alert("✅ Publicación guardada con éxito");

      setFormData({
        id: 0,
        tipo: "imagen",
        contenido: "",
        titulo: "",
        descripcion: "",
        categoria: "Noticia",
        fecha: "",
      });
      setContenidoFile(null);

      onGuardar(result);
      onCerrar();
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      alert("❌ Error al guardar publicación");
    }
  };

  return (
    <div className="crear-informe-overlay">
      <div className="crear-informe-modal">
        <div className="crear-informe-header">
          <h2><FaSave /> Nueva Publicación</h2>
          <button onClick={onCerrar}><FaTimes /></button>
        </div>

        <form className="crear-informe-form" onSubmit={handleSubmit}>
          {/* Tipo de contenido */}
          <div className="form-group">
            <label>Tipo de contenido</label>
            <div className="tipo-selector">
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="select-tipo"
              >
                <option value="imagen">Imagen</option>
                <option value="video">Video local</option>
                <option value="youtube">YouTube</option>
              </select>

              <div className="icono-tipo">
                {formData.tipo === "imagen" && <FaImage className="tipo-icon" />}
                {formData.tipo === "video" && <FaVideo className="tipo-icon" />}
                {formData.tipo === "youtube" && <FaYoutube className="tipo-icon youtube" />}
              </div>
            </div>
          </div>

          {/* Archivo o YouTube */}
          <div className="form-group">
            {formData.tipo !== "youtube" ? (
              <input
                type="file"
                name="contenido"
                accept="image/*,video/*"
                onChange={handleChange}
                className="input-file"
              />
            ) : (
              <input
                type="text"
                name="contenido"
                placeholder="URL de YouTube (https://youtu.be/...)"
                onChange={handleChange}
                className="input-text"
              />
            )}
          </div>

          {/* Vista previa */}
          {formData.contenido && (
            <div className="preview">
              {formData.tipo === "imagen" && <img src={formData.contenido} alt="preview" />}
              {formData.tipo === "video" && <video src={formData.contenido} controls />}
              {formData.tipo === "youtube" && (
                <iframe
                  src={formData.contenido}
                  title="YouTube Preview"
                  allowFullScreen
                />
              )}
            </div>
          )}

          {/* Campos restantes */}
          <input
            type="text"
            name="titulo"
            placeholder="Título"
            value={formData.titulo}
            onChange={handleChange}
            required
          />
          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
          />
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
          >
            <option>Noticia</option>
            <option>Testimonio</option>
            <option>Logro</option>
          </select>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
          />

          <div className="acciones">
            <button type="button" className="btn-cancelar" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              <FaSave /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearInforme;
