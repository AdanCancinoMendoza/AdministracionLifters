import React, { useState, useEffect } from "react";
import "../../../styles/Ganadores.css";
import MenuAdmin from "../../../components/menu";
import { FaMedal } from "react-icons/fa";

interface Ganador {
  nombre: string;
  peso: string;
  medalla: "oro" | "plata" | "bronce";
}

interface Categoria {
  id?: number;
  nombre: string;
  imagen: string; // Ruta del servidor
  ganadores: Ganador[];
  file?: File; // Archivo para subir
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

  // 🔹 Cargar categorías desde el backend
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/categorias`);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setCategorias(data);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    fetchCategorias();
  }, []);

  // 🔹 Cambiar datos de ganadores
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

  // 🔹 Cambiar imagen (previsualización + guardar archivo)
  const handleImagenChange = (catIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newCategorias = [...categorias];
    newCategorias[catIndex].imagen = URL.createObjectURL(file);
    newCategorias[catIndex].file = file;
    setCategorias(newCategorias);
  };

  // 🔹 Guardar categorías y ganadores
  const handleGuardar = async () => {
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
      alert(data.message || "Cambios guardados correctamente");

      // 🔁 Recargar datos actualizados
      const res2 = await fetch(`${SERVER_BASE_URL}/api/categorias`);
      const updated = await res2.json();
      setCategorias(updated);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MenuAdmin />
      <div className="seccion-logros">
        <h1 className="titulo-logros">Sección de Logros</h1>
        <p className="descripcion-logros">
          Aquí puedes ver y editar los logros de cada categoría, incluyendo los
          ganadores y sus resultados.
        </p>

        {categorias.map((cat, catIndex) => (
          <div className="bloque-categoria" key={catIndex}>
            <div className="lista-ganadores">
              <h2>{cat.nombre}</h2>
              <ul>
                {cat.ganadores.map((g, i) => (
                  <li key={i} className="ganador-item">
                    <FaMedal size={24} color={medallas[g.medalla]} className="icono-medalla" />
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={g.nombre}
                      onChange={(e) => handleGanadorChange(catIndex, i, "nombre", e.target.value)}
                      className="input-ganador"
                    />
                    <span className="separador">-</span>
                    <input
                      type="text"
                      placeholder="Peso"
                      value={g.peso}
                      onChange={(e) => handleGanadorChange(catIndex, i, "peso", e.target.value)}
                      className="input-ganador"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="imagen-categoria">
              {cat.imagen && (
                <img
                  src={cat.file ? cat.imagen : `${SERVER_BASE_URL}${cat.imagen}`}
                  alt={cat.nombre}
                  className="imagen-preview"
                />
              )}
              <label htmlFor={`file-${catIndex}`} className="btn-subir">
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

        <button className="guardar-btn" onClick={handleGuardar} disabled={loading}>
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </>
  );
};

export default SeccionLogros;
