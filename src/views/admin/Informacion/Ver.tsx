import { useState, useEffect } from "react";
import "../../../styles/VerInformes.css";
import { FaNewspaper, FaTrophy, FaUsers } from "react-icons/fa";

type TipoContenido = "imagen" | "video" | "youtube";

interface Publicacion {
  ID: number;
  Tipo: TipoContenido;
  Contenido: string;
  Titulo: string;
  Descripcion: string;
  Categoria: string;
  Fecha: string; // YYYY-MM-DD
  FechaCreacion: string;
}

const VerInformes = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");

  const [formData, setFormData] = useState<Publicacion>({
    ID: 0,
    Tipo: "imagen",
    Contenido: "",
    Titulo: "",
    Descripcion: "",
    Categoria: "Noticia",
    Fecha: "",
    FechaCreacion: "",
  });

  const [contenidoFile, setContenidoFile] = useState<File | null>(null);

  // Función para formatear fecha a YYYY-MM-DD
  const formatDate = (dateString: string) => dateString.split("T")[0];

  // Función para convertir link de YouTube a embed
  const getYouTubeEmbed = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  // Cargar publicaciones desde MySQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/publicacion");
        const data: Publicacion[] = await res.json();
        setPublicaciones(
          data.map((pub) => ({
            ...pub,
            Fecha: formatDate(pub.Fecha),
            FechaCreacion: formatDate(pub.FechaCreacion),
          }))
        );
      } catch (err) {
        console.error("❌ Error al cargar publicaciones:", err);
      }
    };
    fetchData();
  }, []);

  // Editar publicación
  const handleEdit = (pub: Publicacion) => {
    setFormData(pub);
    setEditId(pub.ID);
  };

  // Eliminar publicación
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/publicacion/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setPublicaciones(publicaciones.filter((pub) => pub.ID !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("❌ Error eliminando publicación:", err);
    }
  };

  // Manejar cambios en formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;

    if (name === "Contenido" && files && files.length > 0) {
      const file = files[0];
      setContenidoFile(file);
      const tipo: TipoContenido = file.type.includes("video") ? "video" : "imagen";
      setFormData({ ...formData, Contenido: URL.createObjectURL(file), Tipo: tipo });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Actualizar publicación
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("Tipo", formData.Tipo);
      formDataToSend.append("Titulo", formData.Titulo);
      formDataToSend.append("Descripcion", formData.Descripcion);
      formDataToSend.append("Categoria", formData.Categoria);
      formDataToSend.append("Fecha", formData.Fecha);

      if (formData.Tipo !== "youtube" && contenidoFile) {
        formDataToSend.append("Contenido", contenidoFile);
      } else {
        formDataToSend.append("Contenido", formData.Contenido);
      }

      const res = await fetch(`http://localhost:3001/api/publicacion/${formData.ID}`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (!res.ok) throw new Error("Error al actualizar");

      const updated = await res.json();
      setPublicaciones(
        publicaciones.map((pub) =>
          pub.ID === updated.ID
            ? { ...updated, Fecha: formatDate(updated.Fecha), FechaCreacion: formatDate(updated.FechaCreacion) }
            : pub
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
        pub.Titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.Descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((pub) => selectedFilter === "todos" || selectedFilter === pub.Categoria);

  // Contadores dinámicos
  const countNoticias = publicaciones.filter((p) => p.Categoria === "Noticia").length;
  const countLogros = publicaciones.filter((p) => p.Categoria === "Logro").length;
  const countTestimonios = publicaciones.filter((p) => p.Categoria === "Testimonio").length;

  return (
    <div className="verinformes-container">
      <h1 className="verinformes-title">Información sobre Competencias</h1>
      <p className="verinformes-subtitle">Editar y eliminar publicaciones</p>

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
          <div key={pub.ID} className="verinformes-card">
            <div className="verinformes-media-wrapper">
              {pub.Tipo === "imagen" && <img src={pub.Contenido} alt={pub.Titulo} className="verinformes-media" />}
              {pub.Tipo === "video" && <video src={pub.Contenido} controls className="verinformes-media" />}
              {pub.Tipo === "youtube" && getYouTubeEmbed(pub.Contenido) && (
                <iframe
                  src={getYouTubeEmbed(pub.Contenido)}
                  title={pub.Titulo}
                  frameBorder="0"
                  allowFullScreen
                  className="verinformes-media"
                />
              )}
            </div>
            <h2 className="verinformes-card-title">{pub.Titulo}</h2>
            <p className="verinformes-card-description">{pub.Descripcion}</p>
            <span className="verinformes-card-meta">
              {pub.Categoria} · {pub.Fecha}
            </span>
            <div className="verinformes-card-actions">
              <button className="verinformes-btn-edit" onClick={() => handleEdit(pub)}>Editar</button>
              <button className="verinformes-btn-delete" onClick={() => setDeleteId(pub.ID)}>Eliminar</button>
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
              <select name="Tipo" value={formData.Tipo} onChange={handleChange} className="verinformes-input">
                <option value="imagen">Foto</option>
                <option value="video">Video local</option>
                <option value="youtube">Video de YouTube</option>
              </select>

              {formData.Tipo === "youtube" ? (
                <input
                  type="text"
                  name="Contenido"
                  placeholder="URL de YouTube"
                  value={formData.Contenido}
                  onChange={handleChange}
                  className="verinformes-input"
                />
              ) : (
                <input
                  type="file"
                  name="Contenido"
                  accept="image/*,video/*"
                  onChange={handleChange}
                  className="verinformes-input"
                />
              )}

              {formData.Contenido && (
                <div className="verinformes-preview">
                  {formData.Tipo === "imagen" && <img src={formData.Contenido} alt="preview" />}
                  {formData.Tipo === "video" && <video src={formData.Contenido} controls />}
                  {formData.Tipo === "youtube" && getYouTubeEmbed(formData.Contenido) && (
                    <iframe src={getYouTubeEmbed(formData.Contenido)} title="youtube-preview" frameBorder="0" allowFullScreen />
                  )}
                </div>
              )}

              <input type="text" name="Titulo" value={formData.Titulo} onChange={handleChange} required className="verinformes-input" />
              <textarea name="Descripcion" value={formData.Descripcion} onChange={handleChange} required className="verinformes-input" />
              <select name="Categoria" value={formData.Categoria} onChange={handleChange} className="verinformes-input">
                <option>Noticia</option>
                <option>Testimonio</option>
                <option>Logro</option>
              </select>
              <input type="date" name="Fecha" value={formData.Fecha} onChange={handleChange} required className="verinformes-input" />

              <div className="verinformes-modal-buttons">
                <button type="button" className="verinformes-btn-cancel" onClick={() => setEditId(null)}>Cancelar</button>
                <button type="submit" className="verinformes-btn-confirm">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteId !== null && (
        <div className="verinformes-modal-backdrop">
          <div className="verinformes-modal">
            <h3 className="verinformes-modal-title">¿Estás seguro de eliminar esta publicación?</h3>
            <div className="verinformes-modal-buttons">
              <button className="verinformes-btn-cancel" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="verinformes-btn-confirm" onClick={() => handleDelete(deleteId!)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerInformes;
