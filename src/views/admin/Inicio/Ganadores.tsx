import React, { useState, useEffect } from "react";
import "../../../styles/Ganadores.css";
import MenuAdmin from "../../../components/menu";
import { FaMedal } from "react-icons/fa";
import { storage, db } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";

interface Ganador {
  nombre: string;
  peso: string;
  medalla: "oro" | "plata" | "bronce";
}

interface Categoria {
  id?: string;
  nombre: string;
  imagen: string;
  ganadores: Ganador[];
}

const medallas: Record<string, string> = {
  oro: "#FFD700",
  plata: "#C0C0C0",
  bronce: "#CD7F32",
};

// Inicialmente vacío
const initialCategorias: Categoria[] = [
  { nombre: "Sentadilla", imagen: "", ganadores: [{ nombre: "", peso: "", medalla: "oro" }, { nombre: "", peso: "", medalla: "plata" }, { nombre: "", peso: "", medalla: "bronce" }] },
  { nombre: "Peso Muerto", imagen: "", ganadores: [{ nombre: "", peso: "", medalla: "oro" }, { nombre: "", peso: "", medalla: "plata" }, { nombre: "", peso: "", medalla: "bronce" }] },
  { nombre: "Press de Banca", imagen: "", ganadores: [{ nombre: "", peso: "", medalla: "oro" }, { nombre: "", peso: "", medalla: "plata" }, { nombre: "", peso: "", medalla: "bronce" }] },
];

const SeccionLogros: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [loading, setLoading] = useState(false);

  // Cargar datos desde Firestore si existen
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categorias"));
        if (!querySnapshot.empty) {
          const categoriasData: Categoria[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as Categoria;
            categoriasData.push({ ...data, id: docSnap.id });
          });
          setCategorias(categoriasData);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
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
    newCategorias[catIndex].imagen = URL.createObjectURL(file); // Preview
    newCategorias[catIndex]["file"] = file; // Guardar referencia para subir
    setCategorias(newCategorias);
  };

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const categoriasActualizadas = await Promise.all(
        categorias.map(async (cat) => {
          let imagenUrl = cat.imagen;

          // Subir imagen a Firebase Storage si se seleccionó un archivo
          if ((cat as any).file) {
            const file = (cat as any).file as File;
            const storageRef = ref(storage, `categorias/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            imagenUrl = await getDownloadURL(storageRef);
          }

          const categoriaData = {
            nombre: cat.nombre,
            imagen: imagenUrl,
            ganadores: cat.ganadores,
          };

          if (cat.id) {
            await setDoc(doc(db, "categorias", cat.id), categoriaData);
            return { ...categoriaData, id: cat.id };
          } else {
            const docRef = doc(collection(db, "categorias"));
            await setDoc(docRef, categoriaData);
            return { ...categoriaData, id: docRef.id };
          }
        })
      );

      setCategorias(categoriasActualizadas);
      alert("Categorías y ganadores guardados correctamente ✅");
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
          Aquí puedes ver y editar los logros de cada categoría, incluyendo los ganadores y sus resultados.
        </p>

        {categorias.map((cat, catIndex) => (
          <div className="bloque-categoria" key={catIndex}>
            <div className="lista-ganadores">
              <h2>{cat.nombre}</h2>
              <ul>
                {cat.ganadores.map((g, i) => (
                  <li key={i} className="ganador-item">
                    {/* Icono fijo según medalla */}
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
              {cat.imagen && <img src={cat.imagen} alt={cat.nombre} />}
              <label htmlFor={`file-${catIndex}`} className="btn-subir">
                Reemplazar imagen
              </label>
              <input
                type="file"
                id={`file-${catIndex}`}
                onChange={(e) => handleImagenChange(catIndex, e)}
                hidden
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

const Ganadores = SeccionLogros;
export default Ganadores;
