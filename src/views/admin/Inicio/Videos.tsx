import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaSyncAlt, FaTrash, FaTimes, FaCheck } from "react-icons/fa";
import styles from "../../../styles/VideoCompetencia.module.css";
import LoadingModal from "../../../components/common/LoadingModal";
import StatusModal from "../../../components/common/StatusModal";

type TipoVideo = "youtube" | "local";

interface VideoData {
  id?: number;
  tipo: TipoVideo;
  src: string; // para youtube será el link embed; para local será URL completa (http://...)
  videoLocal?: string | null; // path devuelto por el server, ej "/uploads/123.mp4"
  linkVideo?: string | null;   // link original guardado en DB (youtube)
}

const SERVER_BASE_URL = "http://localhost:3001";

const Videos: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [modal, setModal] = useState<{ tipo: string; index?: number }>({ tipo: "" });
  const [videoTipo, setVideoTipo] = useState<TipoVideo>("youtube");
  const [urlVideo, setUrlVideo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // preview objectURL (revocamos cuando sea necesario)
  const objectUrlRef = useRef<string | null>(null);
  const [status, setStatus] = useState<{ open: boolean; type?: "success"|"error"|"info"; title?: string; message?: string }>({ open: false });

  // --- Helpers ---
  const convertirYouTubeEmbed = (url: string) => {
    try {
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
      const match = url.match(regex);
      if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
      // si ya es embed o no coincide, devolver tal cual
      return url;
    } catch {
      return url;
    }
  };

  // --- Load videos from API ---
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/videos`);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();
      // Mapear correctamente: si hay videoLocal => prefijar SERVER_BASE_URL
      const mapped: VideoData[] = data.map((v: any) => {
        const isYoutube = !!v.linkVideo;
        const localPath = v.videoLocal ?? null;
        return {
          id: v.id,
          tipo: isYoutube ? "youtube" : "local",
          linkVideo: v.linkVideo ?? null,
          videoLocal: localPath,
          src: isYoutube
            ? (v.linkVideo as string)
            : localPath
            ? `${SERVER_BASE_URL}${localPath}`
            : "",
        };
      });
      setVideos(mapped);
    } catch (error) {
      console.error("Error al cargar videos:", error);
      setStatus({ open: true, type: "error", title: "Error", message: "No se pudieron cargar los videos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Modal control ---
  const abrirModal = (tipo: string, index?: number) => {
    setModal({ tipo, index });
    setFile(null);
    objectUrlRef.current = null;

    if (index !== undefined) {
      const v = videos[index];
      setVideoTipo(v.tipo);
      // si es local y aún no hay file en el cliente, usar src remoto
      setUrlVideo(v.src || "");
    } else {
      setVideoTipo("youtube");
      setUrlVideo("");
    }
  };

  const cerrarModal = () => {
    setModal({ tipo: "" });
    setVideoTipo("youtube");
    setUrlVideo("");
    setFile(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  // --- File change for local video ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // revocar previo
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;

    setFile(f);
    setVideoTipo("local");
    setUrlVideo(url);
  };

  // --- Save (create or replace) ---
  const guardarModal = async () => {
    // validar
    if (!urlVideo.trim() && !file) {
      setStatus({ open: true, type: "error", title: "Faltan datos", message: "Proporciona un link de YouTube o selecciona un archivo." });
      return;
    }

    setIsSaving(true);
    setLoading(true);

    try {
      const formData = new FormData();

      if (videoTipo === "local" && file) {
        formData.append("videoLocal", file); // multer espera "videoLocal"
        formData.append("tipo", "local");
      } else if (videoTipo === "youtube") {
        const embed = convertirYouTubeEmbed(urlVideo.trim());
        formData.append("tipo", "youtube");
        // En POST tu controlador lee req.body.src; en PUT tu controlador lee req.body.linkVideo.
        // Para ser seguros: añadimos ambos campos (src y linkVideo) — backend aceptará alguno.
        formData.append("src", embed);
        formData.append("linkVideo", embed);
      }

      if (modal.tipo === "agregar") {
        const res = await fetch(`${SERVER_BASE_URL}/api/videos`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || `Error HTTP ${res.status}`);
        }

        // crear objeto para UI usando respuesta del servidor
        const newVideo: VideoData = {
          id: data.id,
          tipo: data.linkVideo ? "youtube" : "local",
          linkVideo: data.linkVideo ?? null,
          videoLocal: data.videoLocal ?? null,
          src: data.linkVideo
            ? data.linkVideo
            : data.videoLocal
            ? `${SERVER_BASE_URL}${data.videoLocal}`
            : "",
        };

        setVideos((prev) => [newVideo, ...prev]);
        setStatus({ open: true, type: "success", title: "Agregado", message: "Video agregado correctamente." });
      } else if (modal.tipo === "reemplazar" && typeof modal.index === "number") {
        const toUpdate = videos[modal.index];
        if (!toUpdate?.id) throw new Error("Video inválido");

        // PUT: algunos controladores esperan field 'linkVideo' para actualización, por eso lo añadimos también
        // (si subimos un archivo, multer lo recibirá en videoLocal)
        const res = await fetch(`${SERVER_BASE_URL}/api/videos/${toUpdate.id}`, {
          method: "PUT",
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || `Error HTTP ${res.status}`);
        }

        // --- FIX: calcular valores intermedios evitando mezclar ?? y || sin paréntesis ---
        const linkVideoVal =
          data.linkVideo ?? (videoTipo === "youtube" ? convertirYouTubeEmbed(urlVideo) : null);
        const videoLocalVal =
          data.videoLocal ?? (videoTipo === "local" && toUpdate.videoLocal ? toUpdate.videoLocal : null);

        const updated: VideoData = {
          id: toUpdate.id,
          tipo: videoTipo,
          linkVideo: linkVideoVal ?? null,
          videoLocal: videoLocalVal ?? null,
          src:
            (data.linkVideo as string)
              ? (data.linkVideo as string)
              : (data.videoLocal as string)
              ? `${SERVER_BASE_URL}${data.videoLocal}`
              : videoTipo === "youtube"
              ? convertirYouTubeEmbed(urlVideo)
              : urlVideo, // for local if user picked file we used objectURL while previewing
        };

        const copy = [...videos];
        copy[modal.index] = updated;
        setVideos(copy);
        setStatus({ open: true, type: "success", title: "Actualizado", message: "Video reemplazado correctamente." });
      }

      cerrarModal();
    } catch (err: any) {
      console.error("Error al guardar video:", err);
      setStatus({ open: true, type: "error", title: "Error", message: err.message || "No se pudo guardar el video." });
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  // --- Delete ---
  const eliminarVideo = async (index: number) => {
    const toDelete = videos[index];
    if (!toDelete?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/videos/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      setVideos((prev) => prev.filter((_, i) => i !== index));
      setStatus({ open: true, type: "success", title: "Eliminado", message: "Video eliminado correctamente." });
      cerrarModal();
    } catch (err) {
      console.error("Error al eliminar video:", err);
      setStatus({ open: true, type: "error", title: "Error", message: "No se pudo eliminar el video." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.agregarVideo}>
      <LoadingModal
        open={loading || isSaving}
        title={isSaving ? "Guardando cambios" : undefined}
        message={isSaving ? "Guardando video en el servidor..." : "Cargando videos..."}
        subMessage={isSaving ? "Por favor espera..." : undefined}
      />

      <StatusModal
        open={status.open}
        type={status.type as any}
        title={status.title}
        message={status.message}
        autoClose
        duration={3000}
        onClose={() => setStatus({ open: false })}
      />

      <h1>Administrar Videos de Competencia</h1>
      <p>Agrega, reemplaza o elimina los videos que formarán parte de la competencia.</p>

      <button className={styles.agregarBtn} onClick={() => abrirModal("agregar")}>
        <FaPlus /> Agregar nuevo video
      </button>

      <div className={styles.videoGrid}>
        {videos.map((video, index) => (
          <div className={styles.videoCard} key={video.id ?? index}>
            {video.tipo === "youtube" ? (
              <iframe src={convertirYouTubeEmbed(video.src)} title={`video-${index}`} frameBorder="0" allowFullScreen />
            ) : (
              <video src={video.src} controls />
            )}
            <div className={styles.videoActions}>
              <button className={styles.reemplazarBtn} onClick={() => abrirModal("reemplazar", index)}>
                <FaSyncAlt /> Reemplazar
              </button>
              <button className={styles.eliminarBtn} onClick={() => abrirModal("eliminar", index)}>
                <FaTrash /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal.tipo && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={cerrarModal}>
              <FaTimes />
            </button>

            {modal.tipo === "eliminar" ? (
              <>
                <h2>¿Eliminar este video?</h2>
                <p>Esta acción no se puede deshacer.</p>
                <div className={styles.modalActions}>
                  <button className={styles.eliminarBtn} onClick={() => eliminarVideo(modal.index!)}>
                    <FaTrash /> Eliminar
                  </button>
                  <button className={styles.cancelarBtn} onClick={cerrarModal}>
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{modal.tipo === "agregar" ? "Agregar nuevo video" : "Reemplazar video"}</h2>

                <select value={videoTipo} onChange={(e) => setVideoTipo(e.target.value as TipoVideo)}>
                  <option value="youtube">YouTube</option>
                  <option value="local">Video Local</option>
                </select>

                {videoTipo === "youtube" ? (
                  <input
                    type="text"
                    placeholder="Ingrese la URL del video (YouTube o embed)"
                    value={urlVideo}
                    onChange={(e) => setUrlVideo(e.target.value)}
                  />
                ) : (
                  <input type="file" accept="video/*" onChange={handleFileChange} />
                )}

                {urlVideo && (
                  <div className={styles.preview}>
                    {videoTipo === "youtube" ? (
                      <iframe src={convertirYouTubeEmbed(urlVideo)} title="preview" frameBorder="0" allowFullScreen />
                    ) : (
                      <video src={urlVideo} controls />
                    )}
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button className={styles.guardarBtn} onClick={guardarModal} disabled={isSaving}>
                    <FaCheck /> {isSaving ? "Guardando..." : "Guardar"}
                  </button>
                  <button className={styles.cancelarBtn} onClick={cerrarModal}>
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;
