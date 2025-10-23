import React, { useRef, useState, useEffect } from "react";
import { FaEdit, FaCheckCircle } from "react-icons/fa";
import styles from "../../../styles/EditarInicio.module.css";

export default function EditarInicio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [texto, setTexto] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos desde backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inicio");
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();

        setTexto(data.Descripcion || "");

        if (imgRef.current) {
          const url = data.Imagen?.startsWith("http")
            ? data.Imagen
            : data.Imagen
            ? `http://localhost:3001${data.Imagen}`
            : "https://assets.worldgym.com/media/38_e605e5d776.png";
          imgRef.current.src = url;
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        alert("❌ Error cargando datos del servidor");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleEditImage = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    if (imgRef.current) imgRef.current.src = url;
  };

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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al guardar");
      }

      const data = await res.json();
      alert("✅ Cambios guardados correctamente");

      setSelectedFile(null);

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
    <main className={styles.pageContent}>
      <h1 className={styles.tituloPanel}>Panel de Inicio</h1>
      <hr className={styles.bordeSeparacion} />
      <p className={styles.descripcionPanel}>
        En esta sección podrás editar parámetros del inicio
      </p>

      <section className={`${styles.card} ${styles.bordeSeparacion}`}>
        <h2 className={styles.subtitulo}>Cambiar imagen y texto de Inicio</h2>

        <div className={styles.gridContainer}>
          {/* Imagen */}
          <div className={styles.imageSection}>
            <img ref={imgRef} alt="Imagen de inicio" className={styles.previewImage} />
            <button
              className={styles.btnEditar}
              type="button"
              onClick={handleEditImage}
            >
              <FaEdit /> Editar Imagen
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Texto */}
          <div className={styles.textSection}>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe el texto de bienvenida aquí..."
              className={styles.textarea}
            />
            <button
              className={styles.btnGuardar}
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
            >
              <FaCheckCircle /> {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
