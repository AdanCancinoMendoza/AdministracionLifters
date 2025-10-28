import React, { useRef, useState, useEffect } from "react";
import { FaEdit, FaCheckCircle } from "react-icons/fa";
import styles from "../../../styles/EditarInicio.module.css";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

export default function EditarInicio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [texto, setTexto] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  // control de la imagen mostrado
  const [imageSrc, setImageSrc] = useState<string>("");

  // para revocar object URLs y evitar memory leaks
  const objectUrlRef = useRef<string | null>(null);

  // estado del modal de estado (success / error / info)
  const [status, setStatus] = useState<{
    open: boolean;
    type?: "success" | "error" | "info";
    title?: string;
    message?: string;
  }>({ open: false });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inicio");
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();

        setTexto(data.Descripcion || "");

        const url =
          data.Imagen?.startsWith("http")
            ? data.Imagen
            : data.Imagen
            ? `http://localhost:3001${data.Imagen}`
            : "https://assets.worldgym.com/media/38_e605e5d776.png";

        setImageSrc(url);
        if (imgRef.current) imgRef.current.src = url;
      } catch (err: any) {
        console.error("Error cargando datos:", err);
        setStatus({
          open: true,
          type: "error",
          title: "Error al cargar",
          message: "No se pudieron obtener los datos del servidor.",
        });
      } finally {
        setLoading(false);
      }
    };

    load();

    // limpiar object URL al desmontar
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleEditImage = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // revocar previo objectURL si existe
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setSelectedFile(file);
    setImageSrc(url);

    if (imgRef.current) imgRef.current.src = url;
  };

  const handleGuardar = async () => {
    if (guardando) return;
    setGuardando(true);

    try {
      const formData = new FormData();
      formData.append("texto", texto);

      if (selectedFile) {
        // si hay archivo nuevo, se lo enviamos
        formData.append("imagen", selectedFile);
      } else {
        // si no hay archivo nuevo, enviamos flags para indicar mantener la imagen actual
        // esto depende de que tu backend soporte estos campos; es una práctica común.
        formData.append("keepImage", "true");
        formData.append("imagenUrl", imageSrc || "");
      }

      const res = await fetch("/api/inicio", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        // intentar leer mensaje del servidor
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al guardar");
      }

      const data = await res.json();

      // mostrar modal de éxito
      setStatus({
        open: true,
        type: "success",
        title: "Datos guardados",
        message: "Cambios guardados correctamente.",
      });

      // si el servidor devuelve la nueva imagen, actualizarla; si no, conservar imageSrc
      if (data.imagenUrl) {
        const url = data.imagenUrl.startsWith("http")
          ? data.imagenUrl
          : `http://localhost:3001${data.imagenUrl}`;
        setImageSrc(url);
        if (imgRef.current) imgRef.current.src = url;
      }

      // limpiar selectedFile y el input file (resetea para futuras ediciones)
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // revocar objectUrl si había uno (ya no lo necesitamos)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    } catch (error: any) {
      console.error("Error guardando datos:", error);
      setStatus({
        open: true,
        type: "error",
        title: "Error al guardar",
        message: error.message || "No se pudieron guardar los cambios.",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <LoadingModal
        open={loading || guardando}
        title={guardando ? "Guardando cambios" : undefined}
        message={guardando ? "Guardando cambios en el servidor..." : "Cargando datos..."}
        subMessage={guardando ? "Por favor espera, no cierres la ventana." : undefined}
      />

      <StatusModal
        open={status.open}
        type={status.type as any}
        title={status.title}
        message={status.message}
        autoClose={true}
        duration={3000}
        onClose={() => setStatus({ open: false })}
      />

      <main className={styles.pageContent} aria-hidden={loading || guardando}>
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
              {/* usamos imageSrc controlado por estado */}
              <img
                ref={imgRef}
                alt="Imagen de inicio"
                className={styles.previewImage}
                src={imageSrc}
              />
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
    </>
  );
}
