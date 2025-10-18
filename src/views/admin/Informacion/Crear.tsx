import { useState } from "react";
import { FaSave } from "react-icons/fa";
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

  // 🧩 Manejar cambios en inputs
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
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 🧩 Enviar datos al backend
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

      if (!response.ok) {
        throw new Error("Error al guardar la publicación");
      }

      const result = await response.json();
      alert("✅ Publicación guardada con éxito");

      // Reset formulario
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
    <div className="crear-informe__overlay">
      <div className="crear-informe__modal">
        <h2 className="crear-informe__titulo">
          <FaSave style={{ marginRight: "8px" }} /> Nueva Publicación
        </h2>

        <form className="crear-informe__form" onSubmit={handleSubmit}>
          {/* Tipo de contenido */}
          <div className="crear-informe__grupo">
            <label className="crear-informe__label">Tipo de contenido</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="crear-informe__select"
            >
              <option value="imagen">📷 Foto</option>
              <option value="video">🎥 Video local</option>
              <option value="youtube">▶️ Video de YouTube</option>
            </select>
          </div>

          {/* Carga de archivo o YouTube */}
          <div className="crear-informe__grupo">
            {formData.tipo !== "youtube" ? (
              <input
                type="file"
                name="contenido"
                accept="image/*,video/*"
                onChange={handleChange}
                className="crear-informe__file"
              />
            ) : (
              <input
                type="text"
                name="contenido"
                placeholder="URL de YouTube"
                value={formData.contenido}
                onChange={handleChange}
                className="crear-informe__input"
              />
            )}
          </div>

          {/* Vista previa */}
          {formData.contenido && (
            <div className="crear-informe__preview">
              {formData.tipo === "imagen" && (
                <img src={formData.contenido} alt="preview" />
              )}
              {formData.tipo === "video" && (
                <video src={formData.contenido} controls />
              )}
              {formData.tipo === "youtube" && (
                <iframe
                  src={formData.contenido}
                  title="youtube-preview"
                  frameBorder="0"
                  allowFullScreen
                />
              )}
            </div>
          )}

          {/* Título */}
          <div className="crear-informe__grupo">
            <input
              type="text"
              name="titulo"
              placeholder="Título"
              value={formData.titulo}
              onChange={handleChange}
              className="crear-informe__input"
              required
            />
          </div>

          {/* Descripción */}
          <div className="crear-informe__grupo">
            <textarea
              name="descripcion"
              placeholder="Descripción"
              value={formData.descripcion}
              onChange={handleChange}
              className="crear-informe__textarea"
              required
            />
          </div>

          {/* Categoría */}
          <div className="crear-informe__grupo">
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="crear-informe__select"
            >
              <option>Noticia</option>
              <option>Testimonio</option>
              <option>Logro</option>
            </select>
          </div>

          {/* Fecha */}
          <div className="crear-informe__grupo">
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="crear-informe__input"
              required
            />
          </div>

          {/* Botones */}
          <div className="crear-informe__acciones">
            <button type="submit" className="crear-informe__btn-guardar">
              <FaSave style={{ marginRight: "5px" }} /> Guardar
            </button>
            <button
              type="button"
              className="crear-informe__btn-cerrar"
              onClick={onCerrar}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearInforme;
