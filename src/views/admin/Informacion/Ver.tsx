import { useState, useEffect } from "react";
import "../../../styles/VerInformes.css";
import {
  FaNewspaper,
  FaTrophy,
  FaUsers,
  FaImage,
  FaVideo,
  FaYoutube,
} from "react-icons/fa";

type TipoContenido = "imagen" | "video" | "youtube";

interface Publicacion {
  ID: number;
  Tipo: TipoContenido;
  Contenido: string;
  Titulo: string;
  Descripcion: string;
  Categoria: string;
  Fecha: string;
  FechaCreacion: string;
}

const SERVER_URL = "http://localhost:3001";

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

  const formatDate = (dateString: string) => dateString.split("T")[0];

  const getYouTubeEmbed = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  const buildMediaURL = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/publicacion`);
        const data: Publicacion[] = await res.json();
        setPublicaciones(
          data.map((pub) => ({
            ...pub,
            Contenido: buildMediaURL(pub.Contenido),
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

  const handleEdit = (pub: Publicacion) => {
    setFormData(pub);
    setEditId(pub.ID);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/publicacion/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setPublicaciones(publicaciones.filter((pub) => pub.ID !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("❌ Error eliminando publicación:", err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files } = e.target as any;

    if (name === "Contenido" && files && files.length > 0) {
      const file = files[0];
      setContenidoFile(file);
      const tipo: TipoContenido = file.type.includes("video")
        ? "video"
        : "imagen";
      setFormData({
        ...formData,
        Contenido: URL.createObjectURL(file),
        Tipo: tipo,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

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

      const res = await fetch(
        `${SERVER_URL}/api/publicacion/${formData.ID}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      if (!res.ok) throw new Error("Error al actualizar");

      const updated = await res.json();
      setPublicaciones(
        publicaciones.map((pub) =>
          pub.ID === updated.ID
            ? {
                ...updated,
                Contenido: buildMediaURL(updated.Contenido),
                Fecha: formatDate(updated.Fecha),
                FechaCreacion: formatDate(updated.FechaCreacion),
              }
            : pub
        )
      );

      setEditId(null);
      setContenidoFile(null);
    } catch (err) {
      console.error("❌ Error actualizando publicación:", err);
    }
  };

  const filteredPublicaciones = publicaciones
    .filter(
      (pub) =>
        pub.Titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.Descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (pub) => selectedFilter === "todos" || selectedFilter === pub.Categoria
    );

  const countNoticias = publicaciones.filter(
    (p) => p.Categoria === "Noticia"
  ).length;
  const countLogros = publicaciones.filter(
    (p) => p.Categoria === "Logro"
  ).length;
  const countTestimonios = publicaciones.filter(
    (p) => p.Categoria === "Testimonio"
  ).length;

  return (
    <div className="verinfo-container">
      <h1 className="verinfo-title"> Panel de Informes</h1>
      <p className="verinfo-subtitle">Gestiona tus publicaciones fácilmente</p>

      {/* Buscador y filtro */}
      <div className="verinfo-filters">
        <input
          type="text"
          placeholder="Buscar publicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="verinfo-input-search"
        />
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="verinfo-select"
        >
          <option value="todos">Todos</option>
          <option value="Noticia">Noticias</option>
          <option value="Logro">Logros</option>
          <option value="Testimonio">Testimonios</option>
        </select>
      </div>

      {/* Contadores */}
      <div className="verinfo-stats">
        <div className="verinfo-stat noticias">
          <FaNewspaper />
          <span>{countNoticias} Noticias</span>
        </div>
        <div className="verinfo-stat logros">
          <FaTrophy />
          <span>{countLogros} Logros</span>
        </div>
        <div className="verinfo-stat testimonios">
          <FaUsers />
          <span>{countTestimonios} Testimonios</span>
        </div>
      </div>

      {/* Grid */}
      <div className="verinfo-grid">
        {filteredPublicaciones.map((pub) => {
          const embedUrl = getYouTubeEmbed(pub.Contenido);
          return (
            <div key={pub.ID} className="verinfo-card">
              <div className="verinfo-media">
                {pub.Tipo === "imagen" && (
                  <img src={pub.Contenido} alt={pub.Titulo} />
                )}
                {pub.Tipo === "video" && (
                  <video src={pub.Contenido} controls />
                )}
                {pub.Tipo === "youtube" && embedUrl && (
                  <iframe
                    src={embedUrl}
                    title={pub.Titulo}
                    allowFullScreen
                  ></iframe>
                )}
              </div>
              <h2>{pub.Titulo}</h2>
              <p>{pub.Descripcion}</p>
              <span>
                {pub.Categoria} · {pub.Fecha}
              </span>
              <div className="verinfo-actions">
                <button onClick={() => handleEdit(pub)}> Editar</button>
                <button onClick={() => setDeleteId(pub.ID)}> Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal editar */}
      {editId !== null && (
        <div className="verinfo-modal-bg">
          <div className="verinfo-modal">
            <h2>Editar Publicación</h2>
            <form onSubmit={handleUpdate}>
              <div className="verinfo-type-selector">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, Tipo: "imagen" })}
                  className={formData.Tipo === "imagen" ? "activo" : ""}
                >
                  <FaImage /> Imagen
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, Tipo: "video" })}
                  className={formData.Tipo === "video" ? "activo" : ""}
                >
                  <FaVideo /> Video
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, Tipo: "youtube" })}
                  className={formData.Tipo === "youtube" ? "activo" : ""}
                >
                  <FaYoutube /> YouTube
                </button>
              </div>

              {formData.Tipo === "youtube" ? (
                <input
                  type="text"
                  name="Contenido"
                  placeholder="URL de YouTube (https://youtu.be/ID)"
                  value={formData.Contenido}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="file"
                  name="Contenido"
                  accept="image/*,video/*"
                  onChange={handleChange}
                />
              )}

              {formData.Contenido && (
                <div className="verinfo-preview">
                  {formData.Tipo === "imagen" && (
                    <img src={formData.Contenido} alt="preview" />
                  )}
                  {formData.Tipo === "video" && (
                    <video src={formData.Contenido} controls />
                  )}
                  {formData.Tipo === "youtube" &&
                    getYouTubeEmbed(formData.Contenido) && (
                      <iframe
                        src={getYouTubeEmbed(formData.Contenido)}
                        title="youtube-preview"
                        allowFullScreen
                      />
                    )}
                </div>
              )}

              <input
                type="text"
                name="Titulo"
                placeholder="Título"
                value={formData.Titulo}
                onChange={handleChange}
              />
              <textarea
                name="Descripcion"
                placeholder="Descripción"
                value={formData.Descripcion}
                onChange={handleChange}
              />
              <select
                name="Categoria"
                value={formData.Categoria}
                onChange={handleChange}
              >
                <option>Noticia</option>
                <option>Logro</option>
                <option>Testimonio</option>
              </select>
              <input
                type="date"
                name="Fecha"
                value={formData.Fecha}
                onChange={handleChange}
              />
              <div className="verinfo-modal-actions">
                <button type="button" onClick={() => setEditId(null)}>
                  Cancelar
                </button>
                <button type="submit">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteId !== null && (
        <div className="verinfo-modal-bg">
          <div className="verinfo-modal">
            <h3>¿Eliminar esta publicación?</h3>
            <div className="verinfo-modal-actions">
              <button onClick={() => setDeleteId(null)}>Cancelar</button>
              <button onClick={() => handleDelete(deleteId)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerInformes;
