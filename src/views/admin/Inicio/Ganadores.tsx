import React, { useState, useEffect } from "react";
import styles from "../../../styles/SeccionLogros.module.css";
import MenuAdmin from "../../../components/menu";
import { FaMedal } from "react-icons/fa";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

interface Ganador {
  nombre: string;
  peso: string;
  medalla: "oro" | "plata" | "bronce";
}

interface Categoria {
  id?: number;
  nombre: string;
  imagen: string;
  ganadores: Ganador[];
  file?: File;
}

const medallas: Record<string, string> = {
  oro: "#FFD700",
  plata: "#C0C0C0",
  bronce: "#CD7F32",
};

const initialCategorias: Categoria[] = [
  {
    nombre: "Sentadilla",
    imagen: "",
    ganadores: [
      { nombre: "", peso: "", medalla: "oro" },
      { nombre: "", peso: "", medalla: "plata" },
      { nombre: "", peso: "", medalla: "bronce" },
    ],
  },
  {
    nombre: "Peso Muerto",
    imagen: "",
    ganadores: [
      { nombre: "", peso: "", medalla: "oro" },
      { nombre: "", peso: "", medalla: "plata" },
      { nombre: "", peso: "", medalla: "bronce" },
    ],
  },
  {
    nombre: "Press de Banca",
    imagen: "",
    ganadores: [
      { nombre: "", peso: "", medalla: "oro" },
      { nombre: "", peso: "", medalla: "plata" },
      { nombre: "", peso: "", medalla: "bronce" },
    ],
  },
];

const SERVER_BASE_URL = "http://localhost:3001";

const SeccionLogros: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // estado del modal de estado (success / error / info)
  const [status, setStatus] = useState<{
    open: boolean;
    type?: "success" | "error" | "info";
    title?: string;
    message?: string;
  }>({ open: false });

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/categorias`);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setCategorias(data);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        setStatus({
          open: true,
          type: "error",
          title: "Error al cargar",
          message: "No se pudieron obtener las categorías del servidor.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  const handleGanadorChange = (
    catIndex: number,
    ganIndex: number,
    field: keyof Ganador,
    value: string
  ) => {
    const newCategorias = [...categorias];
    newCategorias[catIndex].ganadores[ganIndex][field] = value as any;
    setCategorias(newCategorias);
  };

  const handleImagenChange = (catIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newCategorias = [...categorias];
    newCategorias[catIndex].imagen = URL.createObjectURL(file);
    newCategorias[catIndex].file = file;
    setCategorias(newCategorias);
  };

  const handleGuardar = async () => {
    setIsSaving(true);
    setLoading(true);
    try {
      const formData = new FormData();
      const categoriasToSubmit = categorias.map((cat) => ({
        id: cat.id,
        nombre: cat.nombre,
        ganadores: cat.ganadores,
      }));
      formData.append("categorias", JSON.stringify(categoriasToSubmit));
      categorias.forEach((cat, i) => {
        if (cat.file) formData.append(`imagen-${cat.id || `new-${i}`}`, cat.file);
      });

      const res = await fetch(`${SERVER_BASE_URL}/api/categorias`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const data = await res.json();

      // reemplazamos alert por StatusModal
      setStatus({
        open: true,
        type: "success",
        title: data.message || "Cambios guardados",
        message: "Cambios guardados correctamente.",
      });

      // refrescar datos
      const res2 = await fetch(`${SERVER_BASE_URL}/api/categorias`);
      if (res2.ok) {
        const updated = await res2.json();
        setCategorias(updated);
      } else {
        // si falla refrescar, avisar pero no bloquear
        setStatus({
          open: true,
          type: "info",
          title: "Guardado",
          message: "Cambios guardados. No se pudo actualizar la lista local.",
        });
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setStatus({
        open: true,
        type: "error",
        title: "Error al guardar",
        message: "Hubo un error al guardar los datos.",
      });
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingModal
        open={loading}
        title={isSaving ? "Guardando cambios" : undefined}
        message={isSaving ? "Guardando cambios en el servidor..." : "Cargando datos..."}
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
      <div className={styles.seccionLogros}>
        <h1 className={styles.tituloLogros}>Sección de Logros</h1>
        <p className={styles.descripcionLogros}>
          Aquí puedes ver y editar los logros de cada categoría, incluyendo los
          ganadores y sus resultados.
        </p>

        {categorias.map((cat, catIndex) => (
          <div className={styles.bloqueCategoria} key={catIndex}>
            <div className={styles.listaGanadores}>
              <h2>{cat.nombre}</h2>
              <ul className={styles.lista}>
                {cat.ganadores.map((g, i) => (
                  <li key={i} className={styles.ganadorItem}>
                    <FaMedal
                      size={24}
                      color={medallas[g.medalla]}
                      className={styles.iconoMedalla}
                    />
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={g.nombre}
                      onChange={(e) => handleGanadorChange(catIndex, i, "nombre", e.target.value)}
                      className={styles.inputGanador}
                    />
                    <span className={styles.separador}>-</span>
                    <input
                      type="text"
                      placeholder="Peso"
                      value={g.peso}
                      onChange={(e) => handleGanadorChange(catIndex, i, "peso", e.target.value)}
                      className={styles.inputGanador}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.imagenCategoria}>
              {cat.imagen && (
                <img
                  src={cat.file ? cat.imagen : `${SERVER_BASE_URL}${cat.imagen}`}
                  alt={cat.nombre}
                  className={styles.imagenPreview}
                />
              )}
              <label htmlFor={`file-${catIndex}`} className={styles.btnSubir}>
                Reemplazar imagen
              </label>
              <input
                type="file"
                id={`file-${catIndex}`}
                onChange={(e) => handleImagenChange(catIndex, e)}
                hidden
                accept="image/*"
              />
            </div>
          </div>
        ))}

        <button
          className={styles.guardarBtn}
          onClick={handleGuardar}
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </>
  );
};

export default SeccionLogros;
