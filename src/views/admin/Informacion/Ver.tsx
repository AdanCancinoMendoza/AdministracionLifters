import { useState, useEffect } from "react";
import "../../../styles/VerInformes.css";
import { FaNewspaper, FaTrophy, FaUsers } from "react-icons/fa";
import { db, storage } from "../../../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type TipoContenido = "imagen" | "video" | "youtube";

interface Publicacion {
  id: string; // ahora será el ID de Firestore
  tipo: TipoContenido;
  contenido: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha: string;
}

const VerInformes = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");

  const [formData, setFormData] = useState<Publicacion>({
    id: "",
    tipo: "imagen",
    contenido: "",
    titulo: "",
    descripcion: "",
    categoria: "Noticia",
    fecha: "",
  });

  const [contenidoFile, setContenidoFile] = useState<File | null>(null);

  // Cargar publicaciones desde Firestore
  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "publicaciones"));
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Publicacion[];
      setPublicaciones(data);
    };

    fetchData();
  }, []);

  // Contadores dinámicos
  const countNoticias = publicaciones.filter((p) => p.categoria === "Noticia").length;
  const countLogros = publicaciones.filter((p) => p.categoria === "Logro").length;
  const countTestimonios = publicaciones.filter((p) => p.categoria === "Testimonio").length;

  // Editar publicación
  const handleEdit = (pub: Publicacion) => {
    setFormData(pub);
    setEditId(pub.id);
  };

  // Eliminar publicación
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "publicaciones", id));
      setPublicaciones(publicaciones.filter((pub) => pub.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("❌ Error eliminando publicación:", err);
    }
  };

  // Cambios en formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;

    if (name === "contenido" && files && files.length > 0) {
      const file = files[0];
      setContenidoFile(file);
      const tipo: TipoContenido = file.type.includes("video") ? "video" : "imagen";
      setFormData({ ...formData, contenido: URL.createObjectURL(file), tipo });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Actualizar publicación
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let contenidoURL = formData.contenido;

      if (formData.tipo !== "youtube" && contenidoFile) {
        const storageRef = ref(storage, `publicaciones/${Date.now()}_${contenidoFile.name}`);
        await uploadBytes(storageRef, contenidoFile);
        contenidoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "publicaciones", formData.id), {
        tipo: formData.tipo,
        contenido: contenidoURL,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        fecha: formData.fecha,
      });

      setPublicaciones(
        publicaciones.map((pub) =>
          pub.id === formData.id ? { ...formData, contenido: contenidoURL } : pub
        )
      );

      setEditId(null);
      setContenidoFile(null);
    } catch (err) {
      console.error("❌ Error actualizando publicación:", err);
    }
  };

  // Filtro y buscador
  const filteredPublicaciones = publicaciones
    .filter(
      (pub) =>
        pub.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((pub) => selectedFilter === "todos" || selectedFilter === pub.categoria);

  return (
    <div className="verinformes-container">
      <h1 className="verinformes-title">Información sobre Competencias</h1>
      <p className="verinformes-subtitle">
        En esta sección podrás editar y eliminar publicaciones
      </p>

      {/* Filtros y buscador */}
      <div className="verinformes-filters">
        <input
          type="text"
          placeholder="Buscar publicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="verinformes-search"
        />

        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="verinformes-select"
        >
          <option value="todos">Todos</option>
          <option value="Noticia">Noticias</option>
          <option value="Logro">Logro</option>
          <option value="Testimonio">Testimonio</option>
        </select>
      </div>

      {/* Panel de contadores */}
      <div className="verinformes-stats">
        <div className="verinformes-stat-card noticias">
          <FaNewspaper className="stat-icon" />
          <div className="stat-info">
            <span className="stat-number">{countNoticias}</span>
            <span className="stat-label">Noticias</span>
          </div>
        </div>
        <div className="verinformes-stat-card logros">
          <FaTrophy className="stat-icon" />
          <div className="stat-info">
            <span className="stat-number">{countLogros}</span>
            <span className="stat-label">Logros</span>
          </div>
        </div>
        <div className="verinformes-stat-card testimonios">
          <FaUsers className="stat-icon" />
          <div className="stat-info">
            <span className="stat-number">{countTestimonios}</span>
            <span className="stat-label">Testimonios</span>
          </div>
        </div>
      </div>

      {/* Grid de publicaciones */}
      <div className="verinformes-grid">
        {filteredPublicaciones.map((pub) => (
          <div key={pub.id} className="verinformes-card">
            <div className="verinformes-media-wrapper">
              {pub.tipo === "imagen" && (
                <img src={pub.contenido} alt={pub.titulo} className="verinformes-media" />
              )}
              {pub.tipo === "video" && (
                <video src={pub.contenido} controls className="verinformes-media" />
              )}
              {pub.tipo === "youtube" && (
                <iframe
                  src={pub.contenido}
                  title={pub.titulo}
                  frameBorder="0"
                  allowFullScreen
                  className="verinformes-media"
                />
              )}
            </div>
            <h2 className="verinformes-card-title">{pub.titulo}</h2>
            <p className="verinformes-card-description">{pub.descripcion}</p>
            <span className="verinformes-card-meta">
              {pub.categoria} · {pub.fecha}
            </span>
            <div className="verinformes-card-actions">
              <button className="verinformes-btn-edit" onClick={() => handleEdit(pub)}>
                Editar
              </button>
              <button className="verinformes-btn-delete" onClick={() => setDeleteId(pub.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Editar */}
      {editId !== null && (
        <div className="verinformes-modal-backdrop">
          <div className="verinformes-modal">
            <h2 className="verinformes-modal-title">Editar Publicación</h2>
            <form onSubmit={handleUpdate} className="verinformes-form">
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="verinformes-input"
              >
                <option value="imagen">Foto</option>
                <option value="video">Video local</option>
                <option value="youtube">Video de YouTube</option>
              </select>

              {formData.tipo === "youtube" ? (
                <input
                  type="text"
                  name="contenido"
                  placeholder="URL de YouTube"
                  value={formData.contenido}
                  onChange={handleChange}
                  className="verinformes-input"
                />
              ) : (
                <input
                  type="file"
                  name="contenido"
                  accept="image/*,video/*"
                  onChange={handleChange}
                  className="verinformes-input"
                />
              )}

              {formData.contenido && (
                <div className="verinformes-preview">
                  {formData.tipo === "imagen" && (
                    <img src={formData.contenido} alt="preview" />
                  )}
                  {formData.tipo === "video" && (
                    <video src={formData.contenido} controls />
                  )}
                  {formData.tipo === "youtube" && (
                    <iframe
                      src={formData.contenido}
                      title="youtube-preview"
                      frameBorder="0"
                      allowFullScreen
                    />
                  )}
                </div>
              )}

              <input
                type="text"
                name="titulo"
                placeholder="Título"
                value={formData.titulo}
                onChange={handleChange}
                required
                className="verinformes-input"
              />
              <textarea
                name="descripcion"
                placeholder="Descripción"
                value={formData.descripcion}
                onChange={handleChange}
                required
                className="verinformes-input"
              />
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="verinformes-input"
              >
                <option>Noticia</option>
                <option>Testimonio</option>
                <option>Logro</option>
              </select>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                className="verinformes-input"
              />

              <div className="verinformes-modal-buttons">
                <button
                  type="button"
                  className="verinformes-btn-cancel"
                  onClick={() => setEditId(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="verinformes-btn-confirm">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteId !== null && (
        <div className="verinformes-modal-backdrop">
          <div className="verinformes-modal">
            <h3 className="verinformes-modal-title">
              ¿Estás seguro de eliminar esta publicación?
            </h3>
            <div className="verinformes-modal-buttons">
              <button className="verinformes-btn-cancel" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button className="verinformes-btn-confirm" onClick={() => handleDelete(deleteId!)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerInformes;
