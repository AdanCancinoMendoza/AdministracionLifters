import React, { useState } from "react";
import {
  FaSave,
  FaImage,
  FaVideo,
  FaYoutube,
  FaTimes,
} from "react-icons/fa";
import styles from "../../../styles/CrearInforme.module.css";

// Modales reutilizables
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

type TipoContenido = "imagen" | "video" | "youtube";

interface Publicacion {
  ID?: number;
  Tipo: TipoContenido;
  Contenido: string;
  Titulo: string;
  Descripcion: string;
  Categoria: string;
  Fecha: string;
  FechaCreacion?: string;
}

interface CrearInformeProps {
  onGuardar: (pub: Publicacion) => void;
  onCerrar: () => void;
}

const SERVER_URL = "http://localhost:3001";

const CrearInforme: React.FC<CrearInformeProps> = ({ onGuardar, onCerrar }) => {
  const [formData, setFormData] = useState<Publicacion>({
    Tipo: "imagen",
    Contenido: "",
    Titulo: "",
    Descripcion: "",
    Categoria: "Noticia",
    Fecha: "",
  });

  const [contenidoFile, setContenidoFile] = useState<File | null>(null);

  // Modales
  const [loadingModal, setLoadingModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "info" as "success" | "error" | "info",
    title: "",
    message: "",
  });

  const extractYouTubeId = (url: string): string | null => {
    const match =
      url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files } = e.target as any;

    if (name === "Contenido" && files && files.length > 0) {
      const file = files[0] as File;
      setContenidoFile(file);
      const tipo: TipoContenido = file.type.includes("video") ? "video" : "imagen";
      setFormData({ ...formData, Contenido: URL.createObjectURL(file), Tipo: tipo });
    } else if (name === "Contenido" && formData.Tipo === "youtube") {
      const url = value.trim();
      const videoId = extractYouTubeId(url);
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        setFormData({ ...formData, Contenido: embedUrl });
      } else {
        setFormData({ ...formData, Contenido: "" });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Titulo || !formData.Descripcion || !formData.Fecha) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Campos incompletos",
        message: "Por favor completa título, descripción y fecha.",
      });
      return;
    }

    setLoadingModal(true);

    try {
      const fd = new FormData();
      fd.append("Tipo", formData.Tipo);
      fd.append("Titulo", formData.Titulo);
      fd.append("Descripcion", formData.Descripcion);
      fd.append("Categoria", formData.Categoria);
      fd.append("Fecha", formData.Fecha);

      if (formData.Tipo !== "youtube" && contenidoFile) {
        fd.append("Contenido", contenidoFile);
      } else {
        fd.append("Contenido", formData.Contenido);
      }

      const res = await fetch(`${SERVER_URL}/api/publicacion`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al guardar publicación");
      }

      const result = await res.json();

      // Normalizar objeto que regresó el servidor
      const nuevaPub: Publicacion = {
        ID: result?.ID ?? result?.id ?? undefined,
        Tipo: result?.Tipo ?? formData.Tipo,
        Contenido: result?.Contenido ?? formData.Contenido,
        Titulo: result?.Titulo ?? formData.Titulo,
        Descripcion: result?.Descripcion ?? formData.Descripcion,
        Categoria: result?.Categoria ?? formData.Categoria,
        Fecha: result?.Fecha ?? formData.Fecha,
        FechaCreacion: result?.FechaCreacion ?? result?.FechaCreacion ?? undefined,
      };

      setStatusModal({
        open: true,
        type: "success",
        title: "Publicación guardada",
        message: "La publicación se guardó correctamente.",
      });

      // Reset form
      setFormData({
        Tipo: "imagen",
        Contenido: "",
        Titulo: "",
        Descripcion: "",
        Categoria: "Noticia",
        Fecha: "",
      });
      setContenidoFile(null);

      onGuardar(nuevaPub);
      onCerrar();
    } catch (error: any) {
      console.error("Error al guardar publicación:", error);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: error?.message || "No se pudo guardar la publicación.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            <FaSave /> Nueva Publicación
          </h2>
          <button onClick={onCerrar}>
            <FaTimes />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tipo de contenido</label>
            <div className={styles.tipoSelector}>
              <select
                name="Tipo"
                value={formData.Tipo}
                onChange={(e) => setFormData({ ...formData, Tipo: e.target.value as TipoContenido })}
                className={styles.selectTipo}
              >
                <option value="imagen">Imagen</option>
                <option value="video">Video local</option>
                <option value="youtube">YouTube</option>
              </select>

              <div className={styles.iconoTipo}>
                {formData.Tipo === "imagen" && <FaImage className={styles.tipoIcon} />}
                {formData.Tipo === "video" && <FaVideo className={styles.tipoIcon} />}
                {formData.Tipo === "youtube" && <FaYoutube className={`${styles.tipoIcon} ${styles.youtube}`} />}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            {formData.Tipo !== "youtube" ? (
              <input
                type="file"
                name="Contenido"
                accept="image/*,video/*"
                onChange={handleChange}
                className={styles.inputFile}
              />
            ) : (
              <input
                type="text"
                name="Contenido"
                placeholder="URL de YouTube (https://youtu.be/...)"
                onChange={handleChange}
                className={styles.inputText}
              />
            )}
          </div>

          {formData.Contenido && (
            <div className={styles.preview}>
              {formData.Tipo === "imagen" && <img src={formData.Contenido} alt="preview" />}
              {formData.Tipo === "video" && <video src={formData.Contenido} controls />}
              {formData.Tipo === "youtube" && (
                <iframe src={formData.Contenido} title="YouTube Preview" allowFullScreen />
              )}
            </div>
          )}

          <input
            type="text"
            name="Titulo"
            placeholder="Título"
            value={formData.Titulo}
            onChange={handleChange}
            required
          />
          <textarea
            name="Descripcion"
            placeholder="Descripción"
            value={formData.Descripcion}
            onChange={handleChange}
            required
          />
          <select
            name="Categoria"
            value={formData.Categoria}
            onChange={handleChange}
          >
            <option>Noticia</option>
            <option>Testimonio</option>
            <option>Logro</option>
          </select>
          <input
            type="date"
            name="Fecha"
            value={formData.Fecha}
            onChange={handleChange}
            required
          />

          <div className={styles.acciones}>
            <button type="button" className={styles.btnCancelar} onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnGuardar}>
              <FaSave /> Guardar
            </button>
          </div>
        </form>
      </div>

      <LoadingModal open={loadingModal} title="Procesando" message="Por favor espere..." />
      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, open: false })}
      />
    </div>
  );
};

export default CrearInforme;
