import React, { useState, useEffect } from "react";
import { FaImage, FaSave } from "react-icons/fa";
import "../../../styles/Poster.css";
import MenuAdmin from "../../../components/menu";

interface PosterData {
  imagen_url: string;
  fecha_actualizacion: string; // La DB devuelve un string de fecha/hora
}

const Poster: React.FC = () => {
  const [posterUrl, setPosterUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // 🔹 Base URL para las imágenes del servidor Express
  const SERVER_BASE_URL = "http://localhost:3001"; // Asegúrate de que este sea el puerto de tu backend

  // 🔹 Cargar póster desde el backend al iniciar
  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/poster`); // Ruta corregida: /api/poster
        if (res.ok) {
          const data: PosterData = await res.json();
          // Solo si hay una URL de imagen, la establecemos
          if (data.imagen_url) {
            setPosterUrl(`${SERVER_BASE_URL}${data.imagen_url}`); // Construye la URL completa
          } else {
            setPosterUrl(""); // Si no hay imagen, no mostrar nada
          }

          if (data.fecha_actualizacion) {
            setLastUpdate(new Date(data.fecha_actualizacion).toLocaleString());
          }
        } else if (res.status === 404) {
          console.log("No hay póster guardado aún en el servidor (o no encontrado).");
          setPosterUrl(""); // Asegura que no se muestre una imagen vieja
          setLastUpdate(null);
        } else {
          console.error("Error al cargar el póster desde el backend:", res.status);
          setPosterUrl("");
          setLastUpdate(null);
        }
      } catch (error) {
        console.error("Error de red o desconocido al cargar el póster:", error);
        setPosterUrl("");
        setLastUpdate(null);
      }
    };

    fetchPoster();
  }, []); // Se ejecuta solo una vez al montar el componente

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Previsualización de la imagen seleccionada
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
      // 'imagen' debe coincidir con el nombre esperado en Multer (`upload.single("imagen")`)
      formData.append("imagen", file);

      const res = await fetch(`${SERVER_BASE_URL}/api/poster`, {
        method: "PUT", // Cambiado a PUT para actualizar
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        // Al actualizar, el backend debería devolver la nueva URL y fecha_actualizacion
        // En tu backend, `data.imagenUrl` es la ruta relativa guardada.
        setPosterUrl(`${SERVER_BASE_URL}${data.imagenUrl}`);
        // Para la fecha de actualización, si el backend la devuelve, úsala.
        // Si no la devuelve explícitamente, podrías volver a llamar a `fetchPoster`
        // o usar la fecha actual del frontend.
        // Por simplicidad, aquí usaremos la fecha actual si no viene del backend
        setLastUpdate(new Date().toLocaleString());
        setFile(null); // Resetea el archivo seleccionado
      } else {
        alert(`Error: ${data.message || "No se pudo actualizar el póster."}`);
        console.error("Error del servidor:", data);
      }
    } catch (error) {
      console.error("Error de red al subir el póster:", error);
      alert("Hubo un error de red al subir el póster.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <MenuAdmin />

      <section className="actualizar-poster">
        <h1>Actualizar Póster de Competencia</h1>
        <p>
          Aquí puedes cambiar el póster oficial de la competencia. Asegúrate de
          elegir una imagen de alta calidad para que luzca espectacular en todas
          las plataformas.
        </p>

        <div className="poster-contenedor">
          {posterUrl ? (
            <img src={posterUrl} alt="Poster de la competencia" className="current-poster-img" />
          ) : (
            <p>No hay póster cargado aún</p>
          )}
        </div>

        {lastUpdate && (
          <p className="last-update-info">Última actualización: {lastUpdate}</p>
        )}

        <label htmlFor="input-poster" className="cambiar-btn">
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
          className="guardar-btn"
          onClick={handleGuardar}
          disabled={loading || !file} // Deshabilita si no hay archivo seleccionado
        >
          <FaSave /> {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </section>
    </div>
  );
};

export default Poster;