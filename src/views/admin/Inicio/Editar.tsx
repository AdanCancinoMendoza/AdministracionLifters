// src/views/admin/Inicio/Editar.tsx
import React, { useRef, useState, useEffect } from "react";
import "../../../styles/editarInicio.css";
import { FaEdit, FaCheckCircle } from "react-icons/fa";

// IMPORTACIONES DE FIREBASE (ruta según tu estructura)
import { db, storage } from "../../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Editar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);

  // DEBUG: comprueba que db y storage están definidos (quita si quieres)
  useEffect(() => {
    console.log("DEBUG firebase db:", !!db, "storage:", !!storage);
  }, []);

  // Cargar datos guardados (si existen)
  useEffect(() => {
    const load = async () => {
      try {
        const docRef = doc(db, "inicio", "config");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          const texto = data?.textoBienvenida ?? "";
          const imagen = data?.imagen ?? "https://assets.worldgym.com/media/38_e605e5d776.png";

          const textarea = document.getElementById("textoBienvenida") as HTMLTextAreaElement | null;
          if (textarea) textarea.value = texto;
          if (imgRef.current) imgRef.current.src = imagen;
        }
      } catch (err) {
        console.error("Error cargando config desde Firestore:", err);
      }
    };

    load();
  }, []);

  const handleEditImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    if (imgRef.current) imgRef.current.src = url;
  };

  const handleGuardar = async () => {
    const textarea = document.getElementById("textoBienvenida") as HTMLTextAreaElement | null;
    const texto = textarea?.value || "";

    if (guardando) return; // evita clicks múltiples
    setGuardando(true);

    try {
      if (!db) throw new Error("Firestore no inicializado (db undefined)");
      if (!storage) throw new Error("Firebase Storage no inicializado (storage undefined)");

      let imageUrl = "";

      // Subir imagen si existe
      if (selectedFile) {
        // Usa un nombre único para evitar colisiones
        const uniqueName = `${Date.now()}_${selectedFile.name}`;
        const sRef = storageRef(storage, `imagenes/${uniqueName}`);

        // Subida
        const uploadResult = await uploadBytes(sRef, selectedFile).catch((e) => {
          // capturar errores de upload por separado para información más clara
          console.error("Error en uploadBytes:", e);
          throw e;
        });

        // Obtener URL
        imageUrl = await getDownloadURL(sRef);
        console.log("Imagen subida, URL:", imageUrl, "uploadResult:", uploadResult);
      }

      // Guardar en Firestore
      const docRef = doc(db, "inicio", "config");
      await setDoc(docRef, {
        textoBienvenida: texto,
        imagen: imageUrl || (imgRef.current?.src ?? "https://assets.worldgym.com/media/38_e605e5d776.png"),
        updatedAt: new Date().toISOString(),
      });

      alert("✅ Cambios guardados en Firebase");
    } catch (error: any) {
      // Muestra información detallada del error
      console.error("❌ Error al guardar:", error);
      const code = error?.code ?? "";
      const message = error?.message ?? JSON.stringify(error);
      alert(`Hubo un error al guardar los cambios.\n\n${code} ${message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page-content">
      <h1 className="titulo-panel">Panel de Inicio</h1>
      <hr className="borde-separacion" />
      <p className="descripcion-panel">En esta sección podrás editar parámetros del inicio</p>

      <div className="CambiarImagenTexto_Bienvenida borde-separacion">
        <h2>Cambiar imagen y texto de Inicio</h2>

        <div className="ContenedorImagenTexto">
          {/* Bloque imagen */}
          <div className="IMagen_Bienvenida_Cambiar">
            <img ref={imgRef} />
            <button className="btn-editar" type="button" onClick={handleEditImage}>
              <FaEdit /> Editar Imagen
            </button>

            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
          </div>

          {/* Bloque texto */}
          <div className="Texto_Bienvenida_Cambiar">
            <textarea id="textoBienvenida" name="textoBienvenida" placeholder="Escribe el texto de bienvenida aquí..." defaultValue=""></textarea>
            <button className="btn-guardar" type="button" onClick={handleGuardar} disabled={guardando}>
              <FaCheckCircle /> {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
