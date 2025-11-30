// src/views/users/VerInformes.tsx
import React, { useState, useEffect } from "react";
import styles from "../../../styles/VerInformes.module.css";
import {
  FaNewspaper,
  FaTrophy,
  FaUsers,
  FaImage,
  FaVideo,
  FaYoutube,
  FaPlus,
  FaTrash,
  FaEdit,
  FaTimes,
} from "react-icons/fa";

// Modales reutilizables
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

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

const VerInformes: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [formData, setFormData] = useState<any>({
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

  // Crear modal
  const [showCrear, setShowCrear] = useState(false);

  // Modales
  const [loadingModal, setLoadingModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "info" as "success" | "error" | "info",
    title: "",
    message: "",
  });

  const formatDate = (dateString?: string) => (dateString ? dateString.split("T")[0] : "");

  // Protegemos getYouTubeEmbed contra valores no-string
  const getYouTubeEmbed = (url?: string | null) => {
    if (!url || typeof url !== "string") return "";
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  const buildMediaURL = (url?: string | null) => {
    if (!url) return "";
    // Si ya es absoluta (http/https/data/blob) la devuelvo tal cual
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    // si es relativa (/uploads/...) la convierto con SERVER_URL
    return url.startsWith("/") ? `${SERVER_URL}${url}` : `${SERVER_URL}/${url}`;
  };

  // Helper: si la URL pertenece al servidor (SERVER_URL origin), devolver ruta relativa (pathname + search + hash)
  // Si no, devolver la URL tal cual.
  const toRelativeIfFromServer = (url?: string | null) => {
    if (!url) return "";
    try {
      // Si ya es relativa, devuelvo tal cual
      if (url.startsWith("/")) return url;
      const parsed = new URL(url, window.location.origin);
      const serverOrigin = new URL(SERVER_URL).origin;
      if (parsed.origin === serverOrigin) {
        return parsed.pathname + parsed.search + parsed.hash;
      }
      return url;
    } catch {
      // si falla (ej: valor no válido), devuelvo tal cual
      return url;
    }
  };

  const fetchPublicaciones = async () => {
    setLoadingModal(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/publicacion`);
      if (!res.ok) throw new Error("Error al cargar publicaciones");
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
      console.error("Error al cargar publicaciones:", err);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudieron cargar las publicaciones.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  useEffect(() => {
    fetchPublicaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al abrir el modal de editar: guardamos el contenido COMO RUTA RELATIVA si viene del servidor.
  const handleEdit = (pub: Publicacion) => {
    setFormData({
      ID: pub.ID ?? 0,
      Tipo: (pub.Tipo as TipoContenido) ?? "imagen",
      // Aquí convertimos a ruta relativa para que no se muestre/guarde el host
      Contenido: toRelativeIfFromServer(pub.Contenido ?? ""),
      Titulo: pub.Titulo ?? "",
      Descripcion: pub.Descripcion ?? "",
      Categoria: pub.Categoria ?? "Noticia",
      Fecha: pub.Fecha ?? "",
      FechaCreacion: pub.FechaCreacion ?? "",
    });
    setContenidoFile(null);
    setEditId(pub.ID);
  };

  // Normaliza un objeto de publicación para mostrar en la UI (usa objectURL si es archivo local)
  const normalizeForUI = (raw: any, localFile?: File | null): Publicacion => {
    const contenidoUrl = localFile
      ? URL.createObjectURL(localFile)
      : raw && raw.Contenido
      ? typeof raw.Contenido === "string"
        ? raw.Contenido.startsWith("http") || raw.Contenido.startsWith("data:") || raw.Contenido.startsWith("blob:")
          ? raw.Contenido
          : buildMediaURL(raw.Contenido)
        : ""
      : "";

    return {
      ID: raw.ID ?? 0,
      Tipo: (raw.Tipo as TipoContenido) ?? "imagen",
      Contenido: contenidoUrl,
      Titulo: raw.Titulo ?? "",
      Descripcion: raw.Descripcion ?? "",
      Categoria: raw.Categoria ?? "Noticia",
      Fecha: raw.Fecha ? formatDate(raw.Fecha) : "",
      FechaCreacion: raw.FechaCreacion ? formatDate(raw.FechaCreacion) : "",
    } as Publicacion;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement;
    const { name, value, files } = target as any;

    if (name === "Contenido" && files && files.length > 0) {
      const file = files[0] as File;
      setContenidoFile(file);
      const tipo: TipoContenido = file.type.includes("video") ? "video" : "imagen";
      setFormData({
        ...formData,
        Contenido: URL.createObjectURL(file),
        Tipo: tipo,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  /* ===========================
     Optimistic handlers (create / update / delete)
     NOTE: after server confirms we call fetchPublicaciones() to sync the UI
     =========================== */

  // UPDATE (Editar) - Optimistic + asegurar visibilidad + sincronizar con servidor
  const handleUpdate = async (e?: React.FormEvent) => {
    if (e && (e as any).preventDefault) (e as React.FormEvent).preventDefault();
    if (!formData.ID) return;

    const prevList = [...publicaciones];
    const optimistic = normalizeForUI(formData, contenidoFile);

    // update UI immediately
    setPublicaciones((list) => list.map((p) => (p.ID === formData.ID ? optimistic : p)));

    // Si los filtros actuales ocultarían este item (por categoría o búsqueda), ajustamos para mostrarlo
    const wouldBeFilteredOut =
      (selectedFilter !== "todos" && selectedFilter !== optimistic.Categoria) ||
      (searchTerm &&
        !(
          (optimistic.Titulo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (optimistic.Descripcion ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        ));

    if (wouldBeFilteredOut) {
      setSelectedFilter("todos");
      setSearchTerm("");
    }

    // close modal (UX)
    setEditId(null);

    setLoadingModal(true);
    try {
      const fd = new FormData();
      fd.append("Tipo", formData.Tipo);
      fd.append("Titulo", formData.Titulo);
      fd.append("Descripcion", formData.Descripcion);
      fd.append("Categoria", formData.Categoria);
      fd.append("Fecha", formData.Fecha);

      // Si subiste archivo lo mandas; si no, mandas la ruta relativa (no el host)
      if (formData.Tipo !== "youtube" && contenidoFile) {
        fd.append("Contenido", contenidoFile);
      } else {
        fd.append("Contenido", formData.Contenido ?? "");
      }

      const res = await fetch(`${SERVER_URL}/api/publicacion/${formData.ID}`, {
        method: "PUT",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al actualizar");
      }

      // server confirmed: re-sync full list to be safe and consistent
      await fetchPublicaciones();

      setContenidoFile(null);
      setStatusModal({
        open: true,
        type: "success",
        title: "Actualizado",
        message: "La publicación fue actualizada correctamente.",
      });
    } catch (err) {
      console.error("Error actualizando publicación:", err);
      // revertir UI
      setPublicaciones(prevList);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudo actualizar la publicación.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  // CREATE (Nuevo) - Optimistic + asegurar visibilidad + sincronizar con servidor
  const handleCreate = async (e?: React.FormEvent) => {
    if (e && (e as any).preventDefault) (e as React.FormEvent).preventDefault();

    // temp negative id
    const tempId = -Date.now();
    const optimisticCreated = normalizeForUI({ ...formData, ID: tempId }, contenidoFile);

    // insert immediately
    setPublicaciones((list) => [optimisticCreated, ...list]);

    // Si los filtros actuales ocultarían este item, reseteamos filtros para asegurarnos que sea visible
    const wouldBeFilteredOut =
      (selectedFilter !== "todos" && selectedFilter !== optimisticCreated.Categoria) ||
      (searchTerm &&
        !(
          (optimisticCreated.Titulo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (optimisticCreated.Descripcion ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        ));

    if (wouldBeFilteredOut) {
      setSelectedFilter("todos");
      setSearchTerm("");
    }

    // close modal
    setShowCrear(false);

    // small UX: scroll to top to show the new item (grid usually at top)
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 80);

    setLoadingModal(true);
    try {
      const fd = new FormData();
      fd.append("Tipo", formData.Tipo);
      fd.append("Titulo", formData.Titulo);
      fd.append("Descripcion", formData.Descripcion);
      fd.append("Categoria", formData.Categoria);
      fd.append("Fecha", formData.Fecha);

      if (formData.Tipo !== "youtube" && contenidoFile) {
        fd.append("Contenido", contenidoFile);
      } else {
        // mandamos la ruta relativa (si es texto), no el host completo
        fd.append("Contenido", formData.Contenido ?? "");
      }

      const res = await fetch(`${SERVER_URL}/api/publicacion`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al crear");
      }

      // server confirmed: re-sync full list to be safe and consistent
      await fetchPublicaciones();

      // reset form
      setFormData({
        ID: 0,
        Tipo: "imagen",
        Contenido: "",
        Titulo: "",
        Descripcion: "",
        Categoria: "Noticia",
        Fecha: "",
        FechaCreacion: "",
      });
      setContenidoFile(null);

      setStatusModal({
        open: true,
        type: "success",
        title: "Creado",
        message: "La publicación fue creada correctamente.",
      });
    } catch (err) {
      console.error("Error creando publicación:", err);
      // remove temp
      setPublicaciones((list) => list.filter((p) => p.ID !== tempId));
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudo crear la publicación.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  // DELETE - Optimistic
  const handleDelete = async (id: number) => {
    const prevList = [...publicaciones];
    setPublicaciones((list) => list.filter((p) => p.ID !== id));

    setLoadingModal(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/publicacion/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al eliminar");
      }

      // After delete, sync server list
      await fetchPublicaciones();

      setStatusModal({
        open: true,
        type: "success",
        title: "Eliminado",
        message: "La publicación fue eliminada correctamente.",
      });
      setDeleteId(null);
    } catch (err) {
      console.error("Error eliminando publicación:", err);
      // revertir UI
      setPublicaciones(prevList);
      setStatusModal({
        open: true,
        type: "error",
        title: "Error",
        message: "No se pudo eliminar la publicación.",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const filteredPublicaciones = publicaciones
    .filter(
      (pub) =>
        (pub.Titulo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pub.Descripcion ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((pub) => selectedFilter === "todos" || selectedFilter === pub.Categoria);

  const countNoticias = publicaciones.filter((p) => p.Categoria === "Noticia").length;
  const countLogros = publicaciones.filter((p) => p.Categoria === "Logro").length;
  const countTestimonios = publicaciones.filter((p) => p.Categoria === "Testimonio").length;

  // Helper para renderizar preview (si formData.Contenido es relativa -> hacer buildMediaURL)
  const previewSrc = (content: string | undefined) => {
    if (!content) return "";
    if (/^(https?:|data:|blob:)/i.test(content)) return content;
    return buildMediaURL(content);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Panel de Informes</h1>
      <p className={styles.subtitle}>Gestiona tus publicaciones fácilmente</p>

      <div className={styles.topRow}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Buscar publicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.inputSearch}
          />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className={styles.selectFilter}
          >
            <option value="todos">Todos</option>
            <option value="Noticia">Noticias</option>
            <option value="Logro">Logros</option>
            <option value="Testimonio">Testimonios</option>
          </select>
        </div>

        <div>
          <button
            className={styles.btnCrear}
            onClick={() => {
              setFormData({
                ID: 0,
                Tipo: "imagen",
                Contenido: "",
                Titulo: "",
                Descripcion: "",
                Categoria: "Noticia",
                Fecha: "",
                FechaCreacion: "",
              });
              setContenidoFile(null);
              setShowCrear(true);
            }}
          >
            <FaPlus /> Nueva publicación
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.noticias}`}>
          <FaNewspaper />
          <span>{countNoticias} Noticias</span>
        </div>
        <div className={`${styles.stat} ${styles.logros}`}>
          <FaTrophy />
          <span>{countLogros} Logros</span>
        </div>
        <div className={`${styles.stat} ${styles.testimonios}`}>
          <FaUsers />
          <span>{countTestimonios} Testimonios</span>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredPublicaciones.map((pub) => {
          const embedUrl = getYouTubeEmbed(pub.Contenido);
          return (
            <div key={pub.ID} className={styles.card}>
              <div className={styles.media}>
                {pub.Tipo === "imagen" && pub.Contenido && <img src={pub.Contenido} alt={pub.Titulo} />}
                {pub.Tipo === "video" && pub.Contenido && <video src={pub.Contenido} controls />}
                {pub.Tipo === "youtube" && embedUrl && (
                  <iframe src={embedUrl} title={pub.Titulo} allowFullScreen />
                )}
              </div>
              <h2>{pub.Titulo}</h2>
              <p>{pub.Descripcion}</p>
              <span>
                {pub.Categoria} · {pub.Fecha}
              </span>
              <div className={styles.actions}>
                <button
                  onClick={() => {
                    handleEdit(pub);
                  }}
                >
                  <FaEdit /> Editar
                </button>
                <button
                  onClick={() => {
                    setDeleteId(pub.ID);
                  }}
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================
          MODAL CREAR (integrado aquí)
         ============================ */}
      {showCrear && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCrear(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()} aria-labelledby="crear-title">
            <header className={styles.modalHeader}>
              <div>
                <h3 id="crear-title">Crear publicación</h3>
                <p className={styles.modalSub}>Agrega una nueva imagen, video o enlace de YouTube</p>
              </div>
              <button className={styles.iconBtn} aria-label="Cerrar" onClick={() => setShowCrear(false)}>
                <FaTimes />
              </button>
            </header>

            <div className={styles.modalBody}>
              <form className={styles.modalForm} onSubmit={(e) => handleCreate(e)}>
                <div className={styles.typeSelector}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, Tipo: "imagen" })}
                    className={formData.Tipo === "imagen" ? styles.activo : ""}
                  >
                    <FaImage /> Imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, Tipo: "video" })}
                    className={formData.Tipo === "video" ? styles.activo : ""}
                  >
                    <FaVideo /> Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, Tipo: "youtube" })}
                    className={formData.Tipo === "youtube" ? styles.activo : ""}
                  >
                    <FaYoutube /> YouTube
                  </button>
                </div>

                {formData.Tipo === "youtube" ? (
                  <input
                    name="Contenido"
                    type="text"
                    placeholder="URL de YouTube (https://youtu.be/ID)"
                    value={formData.Contenido}
                    onChange={handleChange}
                    className={styles.input}
                  />
                ) : (
                  <input
                    name="Contenido"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleChange}
                    className={styles.input}
                  />
                )}

                {formData.Contenido && (
                  <div className={styles.preview}>
                    {formData.Tipo === "imagen" && <img src={previewSrc(formData.Contenido)} alt="preview" />}
                    {formData.Tipo === "video" && <video src={previewSrc(formData.Contenido)} controls />}
                    {formData.Tipo === "youtube" && getYouTubeEmbed(formData.Contenido) && (
                      <iframe src={getYouTubeEmbed(formData.Contenido)} title="youtube-preview" allowFullScreen />
                    )}
                  </div>
                )}

                <input
                  name="Titulo"
                  type="text"
                  placeholder="Título"
                  value={formData.Titulo}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
                <textarea
                  name="Descripcion"
                  placeholder="Descripción"
                  value={formData.Descripcion}
                  onChange={handleChange}
                  className={styles.textarea}
                />

                <select name="Categoria" value={formData.Categoria} onChange={handleChange} className={styles.select}>
                  <option>Noticia</option>
                  <option>Logro</option>
                  <option>Testimonio</option>
                </select>

                <input name="Fecha" type="date" value={formData.Fecha} onChange={handleChange} className={styles.input} />
              </form>
            </div>

            <footer className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button className={styles.btnGhost} type="button" onClick={() => setShowCrear(false)}>
                  Cancelar
                </button>
                <button className={styles.btnPrimary} type="button" onClick={() => handleCreate()}>
                  Crear
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ============================
          MODAL EDITAR (mejorado)
         ============================ */}
      {editId !== null && (
        <div className={styles.modalOverlay} onClick={() => setEditId(null)} role="dialog" aria-modal="true">
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()} aria-labelledby="editar-title">
            <header className={styles.modalHeader}>
              <div>
                <h3 id="editar-title">Editar publicación</h3>
                <p className={styles.modalSub}>
                  ID #{formData.ID} — {formData.Titulo}
                </p>
              </div>
              <button className={styles.iconBtn} aria-label="Cerrar" onClick={() => setEditId(null)}>
                <FaTimes />
              </button>
            </header>

            <div className={styles.modalBody}>
              <form className={styles.modalForm} onSubmit={(e) => handleUpdate(e)}>
                <div className={styles.typeSelector}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, Tipo: "imagen" })}
                    className={formData.Tipo === "imagen" ? styles.activo : ""}
                  >
                    <FaImage /> Imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, Tipo: "video" })}
                    className={formData.Tipo === "video" ? styles.activo : ""}
                  >
                    <FaVideo /> Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, Tipo: "youtube" })}
                    className={formData.Tipo === "youtube" ? styles.activo : ""}
                  >
                    <FaYoutube /> YouTube
                  </button>
                </div>

                {formData.Tipo === "youtube" ? (
                  <input
                    name="Contenido"
                    type="text"
                    placeholder="URL de YouTube (https://youtu.be/ID)"
                    value={formData.Contenido}
                    onChange={handleChange}
                    className={styles.input}
                  />
                ) : (
                  <input
                    name="Contenido"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleChange}
                    className={styles.input}
                  />
                )}

                {formData.Contenido && (
                  <div className={styles.preview}>
                    {formData.Tipo === "imagen" && <img src={previewSrc(formData.Contenido)} alt="preview" />}
                    {formData.Tipo === "video" && <video src={previewSrc(formData.Contenido)} controls />}
                    {formData.Tipo === "youtube" && getYouTubeEmbed(formData.Contenido) && (
                      <iframe src={getYouTubeEmbed(formData.Contenido)} title="youtube-preview" allowFullScreen />
                    )}
                  </div>
                )}

                <input
                  name="Titulo"
                  type="text"
                  placeholder="Título"
                  value={formData.Titulo}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
                <textarea name="Descripcion" placeholder="Descripción" value={formData.Descripcion} onChange={handleChange} className={styles.textarea} />

                <select name="Categoria" value={formData.Categoria} onChange={handleChange} className={styles.select}>
                  <option>Noticia</option>
                  <option>Logro</option>
                  <option>Testimonio</option>
                </select>

                <input name="Fecha" type="date" value={formData.Fecha} onChange={handleChange} className={styles.input} />
              </form>
            </div>

            <footer className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button className={styles.btnGhost} type="button" onClick={() => setEditId(null)}>
                  Cancelar
                </button>
                <button className={styles.btnPrimary} type="button" onClick={() => handleUpdate()}>
                  Actualizar
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ============================
          MODAL ELIMINAR (mejorado)
         ============================ */}
      {deleteId !== null && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)} role="dialog" aria-modal="true">
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <h3>Eliminar publicación</h3>
                <p className={styles.modalSub}>Esta acción no se puede deshacer</p>
              </div>
              <button className={styles.iconBtn} aria-label="Cerrar" onClick={() => setDeleteId(null)}>
                <FaTimes />
              </button>
            </header>

            <div className={styles.modalBody}>
              <p>¿Estás seguro que deseas eliminar esta publicación?</p>
            </div>

            <footer className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button className={styles.btnGhost} type="button" onClick={() => setDeleteId(null)}>
                  Cancelar
                </button>
                <button className={styles.btnDanger} type="button" onClick={() => deleteId && handleDelete(deleteId)}>
                  Eliminar
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Modales globales */}
      <LoadingModal open={loadingModal} title="Procesando" message="Por favor espere..." />
      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, open: false })}
      />
    </div>
  );
};

export default VerInformes;
