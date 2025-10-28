import React, { useState, useEffect, useRef } from "react";
import { FaImage, FaSave } from "react-icons/fa";
import styles from "../../../styles/Poster.module.css";
import MenuAdmin from "../../../components/menu";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

interface PosterData {
  imagen_url: string;
  fecha_actualizacion: string;
  imagenUrl?: string; // por si la API usa camelCase al devolver
  message?: string;
}

const Poster: React.FC = () => {
  const [posterUrl, setPosterUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false); // para carga inicial y cuando refrescamos
  const [isSaving, setIsSaving] = useState(false); // para la operación de guardar
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const SERVER_BASE_URL = "http://localhost:3001";
  const objectUrlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // estado del modal de estado (success / error / info)
  const [status, setStatus] = useState<{
    open: boolean;
    type?: "success" | "error" | "info";
    title?: string;
    message?: string;
  }>({ open: false });

  useEffect(() => {
    const fetchPoster = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/poster`);
        if (res.ok) {
          const data: PosterData = await res.json();
          if (data.imagen_url || (data as any).imagenUrl) {
            const imgPath = data.imagen_url || (data as any).imagenUrl;
            const url = imgPath.startsWith("http") ? imgPath : `${SERVER_BASE_URL}${imgPath}`;
            setPosterUrl(url);
          } else {
            setPosterUrl("");
          }

          if (data.fecha_actualizacion) {
            setLastUpdate(new Date(data.fecha_actualizacion).toLocaleString());
          } else {
            setLastUpdate(null);
          }
        } else if (res.status === 404) {
          setPosterUrl("");
          setLastUpdate(null);
        } else {
          setPosterUrl("");
          setLastUpdate(null);
          setStatus({
            open: true,
            type: "error",
            title: "Error al cargar",
            message: "No se pudo obtener el póster desde el servidor.",
          });
        }
      } catch (error) {
        console.error("Error fetching poster:", error);
        setPosterUrl("");
        setLastUpdate(null);
        setStatus({
          open: true,
          type: "error",
          title: "Error de red",
          message: "No se pudo conectar al servidor para obtener el póster.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPoster();

    return () => {
      // revocar objectURL si existe al desmontar
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    // revocar previo objectURL si existe
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;

    setFile(f);
    setPosterUrl(url);
  };

  const handleGuardar = async () => {
    if (!file) {
      setStatus({
        open: true,
        type: "error",
        title: "Sin imagen",
        message: "Por favor selecciona una imagen antes de guardar.",
      });
      return;
    }

    setIsSaving(true);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("imagen", file);

      const res = await fetch(`${SERVER_BASE_URL}/api/poster`, {
        method: "PUT",
        body: formData,
      });

      const data: PosterData = await res.json().catch(() => ({} as PosterData));

      if (res.ok) {
        setStatus({
          open: true,
          type: "success",
          title: data.message || "Póster actualizado",
          message: "El póster se actualizó correctamente.",
        });

        // actualizar URL según lo que devuelva la API (imagenUrl o imagen_url)
        const returnedPath = data.imagenUrl || data.imagen_url;
        if (returnedPath) {
          const url = returnedPath.startsWith("http") ? returnedPath : `${SERVER_BASE_URL}${returnedPath}`;
          setPosterUrl(url);
        } else {
          // si la API no devolvió la ruta final, usamos la actual (objectURL) y marcamos la fecha
          // en entornos reales es mejor confiar en la respuesta del servidor
        }

        // actualizar fecha de última modificación si el servidor la devuelve,
        // si no, usar la hora local como referencia
        if ((data as any).fecha_actualizacion) {
          setLastUpdate(new Date((data as any).fecha_actualizacion).toLocaleString());
        } else {
          setLastUpdate(new Date().toLocaleString());
        }

        // limpiar archivo seleccionado y el input
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
      } else {
        setStatus({
          open: true,
          type: "error",
          title: "Error al guardar",
          message: data.message || "No se pudo actualizar el póster.",
        });
      }
    } catch (error) {
      console.error("Error uploading poster:", error);
      setStatus({
        open: true,
        type: "error",
        title: "Error de red",
        message: "Hubo un error de red al subir el póster.",
      });
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContent}>
      <LoadingModal
        open={loading || isSaving}
        title={isSaving ? "Guardando cambios" : undefined}
        message={isSaving ? "Guardando póster en el servidor..." : "Cargando datos..."}
        subMessage={isSaving ? "Por favor espera, no cierres la ventana." : undefined}
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

      <MenuAdmin />

      <section className={styles.actualizarPoster}>
        <h1>Actualizar Póster de Competencia</h1>
        <p>
          Aquí puedes cambiar el póster oficial de la competencia. Asegúrate de
          elegir una imagen de alta calidad para que luzca espectacular en todas
          las plataformas.
        </p>

        <div className={styles.posterContenedor}>
          {posterUrl ? (
            <img src={posterUrl} alt="Poster de la competencia" className={styles.currentPosterImg} />
          ) : (
            <p>No hay póster cargado aún</p>
          )}
        </div>

        {lastUpdate && (
          <p className={styles.lastUpdateInfo}>Última actualización: {lastUpdate}</p>
        )}

        <label htmlFor="input-poster" className={styles.cambiarBtn}>
          <FaImage /> Cambiar imagen
        </label>
        <input
          ref={inputRef}
          type="file"
          id="input-poster"
          accept="image/*"
          onChange={handlePosterChange}
          hidden
        />

        <button
          className={styles.guardarBtn}
          onClick={handleGuardar}
          disabled={isSaving || loading || !file}
        >
          <FaSave /> {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </section>
    </div>
  );
};

export default Poster;
