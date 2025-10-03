import React, { useState, useEffect } from "react";
import { FaImage, FaSave } from "react-icons/fa";
import "../../../styles/Poster.css";
import MenuAdmin from "../../../components/menu"; 
import { storage, db } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";

const Poster: React.FC = () => {
  const [poster, setPoster] = useState<string>(""); // Inicial vacío
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar póster desde Firestore al iniciar
  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const docRef = doc(db, "poster", "actual");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPoster(data.url); // URL que ya guardaste
        } else {
          console.log("No hay póster guardado aún.");
        }
      } catch (error) {
        console.error("Error al cargar el póster:", error);
      }
    };

    fetchPoster();
  }, []);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const imageUrl = URL.createObjectURL(selectedFile);
      setPoster(imageUrl);
    }
  };

  const handleGuardar = async () => {
    if (!file) {
      alert("Por favor selecciona una imagen antes de guardar.");
      return;
    }

    try {
      setLoading(true);

      // Subir a Storage
      const storageRef = ref(storage, `posters/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);

      // Guardar URL en Firestore
      await setDoc(doc(db, "poster", "actual"), {
        url: downloadURL,
        updatedAt: new Date(),
      });

      alert("Póster actualizado correctamente!");
      setFile(null);
      setPoster(downloadURL); // Mostrar la nueva imagen directamente
    } catch (error) {
      console.error("Error al subir el póster:", error);
      alert("Hubo un error al subir el póster.");
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
          {poster ? (
            <img src={poster} alt="Poster de la competencia" />
          ) : (
            <p>No hay póster cargado aún</p>
          )}
        </div>

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
          disabled={loading}
        >
          <FaSave /> {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </section>
    </div>
  );
};

export default Poster;
