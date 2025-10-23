import React, { useState, useEffect } from "react";
import { FaImage, FaSave } from "react-icons/fa";
import styles from "../../../styles/Poster.module.css";
import MenuAdmin from "../../../components/menu";

interface PosterData {
  imagen_url: string;
  fecha_actualizacion: string;
}

const Poster: React.FC = () => {
  const [posterUrl, setPosterUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const SERVER_BASE_URL = "http://localhost:3001";

  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/poster`);
        if (res.ok) {
          const data: PosterData = await res.json();
          if (data.imagen_url) setPosterUrl(`${SERVER_BASE_URL}${data.imagen_url}`);
          else setPosterUrl("");
          if (data.fecha_actualizacion)
            setLastUpdate(new Date(data.fecha_actualizacion).toLocaleString());
        } else if (res.status === 404) {
          setPosterUrl("");
          setLastUpdate(null);
        } else {
          setPosterUrl("");
          setLastUpdate(null);
        }
      } catch (error) {
        setPosterUrl("");
        setLastUpdate(null);
      }
    };
    fetchPoster();
  }, []);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPosterUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleGuardar = async () => {
    if (!file) {
      alert("Por favor selecciona una imagen antes de guardar.");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("imagen", file);

      const res = await fetch(`${SERVER_BASE_URL}/api/poster`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setPosterUrl(`${SERVER_BASE_URL}${data.imagenUrl}`);
        setLastUpdate(new Date().toLocaleString());
        setFile(null);
      } else {
        alert(`Error: ${data.message || "No se pudo actualizar el póster."}`);
      }
    } catch (error) {
      alert("Hubo un error de red al subir el póster.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContent}>
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
          type="file"
          id="input-poster"
          accept="image/*"
          onChange={handlePosterChange}
          hidden
        />

        <button
          className={styles.guardarBtn}
          onClick={handleGuardar}
          disabled={loading || !file}
        >
          <FaSave /> {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </section>
    </div>
  );
};

export default Poster;
