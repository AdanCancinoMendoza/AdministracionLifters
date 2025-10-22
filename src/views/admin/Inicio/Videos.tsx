import React, { useState, useEffect } from "react";
import { FaPlus, FaSyncAlt, FaTrash, FaTimes, FaCheck } from "react-icons/fa";
import "../../../styles/VideoCompetencia.css";

type TipoVideo = "youtube" | "local";

interface VideoData {
  id?: number;
  tipo: TipoVideo;
  src: string;
}

const Videos: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [modal, setModal] = useState<{ tipo: string; index?: number }>({ tipo: "" });
  const [videoTipo, setVideoTipo] = useState<TipoVideo>("youtube");
  const [urlVideo, setUrlVideo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar videos desde la base de datos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/videos");
        const data = await res.json();
        const mappedVideos = data.map((v: any) => ({
          id: v.id,
          tipo: v.linkVideo ? "youtube" : "local",
          src: v.linkVideo ?? v.videoLocal,
        }));
        setVideos(mappedVideos);
      } catch (error) {
        console.error("Error al cargar videos:", error);
      }
    };
    fetchVideos();
  }, []);

  const abrirModal = (tipo: string, index?: number) => {
    setModal({ tipo, index });
    if (index !== undefined) {
      setVideoTipo(videos[index].tipo);
      setUrlVideo(videos[index].src);
      setFile(null);
    } else {
      setVideoTipo("youtube");
      setUrlVideo("");
      setFile(null);
    }
  };

  const cerrarModal = () => {
    setModal({ tipo: "" });
    setUrlVideo("");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setVideoTipo("local");
      const localUrl = URL.createObjectURL(selectedFile);
      setUrlVideo(localUrl); // vista previa
    }
  };

  const convertirYouTubeEmbed = (url: string) => {
    try {
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
      const match = url.match(regex);
      if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
      return url;
    } catch {
      return url;
    }
  };

  const guardarModal = async () => {
    if (!urlVideo.trim() && !file) return;

    setLoading(true);
    try {
      let formData = new FormData();

      if (videoTipo === "local" && file) {
        formData.append("videoLocal", file);
        formData.append("tipo", "local");
      } else if (videoTipo === "youtube") {
        formData.append("tipo", "youtube");
        formData.append("src", convertirYouTubeEmbed(urlVideo));
      }

      // Agregar
      if (modal.tipo === "agregar") {
        const res = await fetch("http://localhost:3001/api/videos", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setVideos([
          ...videos,
          {
            id: data.id,
            tipo: data.linkVideo ? "youtube" : "local",
            src: data.linkVideo ?? data.videoLocal,
          },
        ]);
      }
      // Reemplazar
      else if (modal.tipo === "reemplazar" && modal.index !== undefined) {
        const videoId = videos[modal.index].id!;
        await fetch(`http://localhost:3001/api/videos/${videoId}`, {
          method: "PUT",
          body: formData,
        });
        const updatedVideos = [...videos];
        updatedVideos[modal.index] = {
          id: videoId,
          tipo: videoTipo,
          src: videoTipo === "youtube" ? convertirYouTubeEmbed(urlVideo) : urlVideo,
        };
        setVideos(updatedVideos);
      }

      cerrarModal();
    } catch (error) {
      console.error("Error al guardar video:", error);
      alert("Hubo un error al guardar el video.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarVideo = async (index: number) => {
    try {
      const videoId = videos[index].id!;
      await fetch(`http://localhost:3001/api/videos/${videoId}`, { method: "DELETE" });
      setVideos(videos.filter((_, i) => i !== index));
      cerrarModal();
    } catch (error) {
      console.error("Error al eliminar video:", error);
    }
  };

  return (
    <div className="agregar-video">
      <h1>Administrar Videos de Competencia</h1>
      <p>Agrega, reemplaza o elimina los videos que formarán parte de la competencia.</p>

      <button className="agregar-btn" onClick={() => abrirModal("agregar")}>
        <FaPlus /> Agregar nuevo video
      </button>

      <div className="video-grid">
        {videos.map((video, index) => (
          <div className="video-card" key={index}>
            {video.tipo === "youtube" ? (
              <iframe src={video.src} title={`video-${index}`} frameBorder="0" allowFullScreen></iframe>
            ) : (
              <video src={video.src} controls />
            )}
            <div className="video-actions">
              <button className="reemplazar-btn" onClick={() => abrirModal("reemplazar", index)}>
                <FaSyncAlt /> Reemplazar
              </button>
              <button className="eliminar-btn" onClick={() => abrirModal("eliminar", index)}>
                <FaTrash /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal.tipo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={cerrarModal}>
              <FaTimes />
            </button>

            {modal.tipo === "eliminar" ? (
              <>
                <h2>¿Eliminar este video?</h2>
                <p>Esta acción no se puede deshacer.</p>
                <div className="modal-actions">
                  <button className="eliminar-btn" onClick={() => eliminarVideo(modal.index!)}>
                    <FaTrash /> Eliminar
                  </button>
                  <button className="cancelar-btn" onClick={cerrarModal}>
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
                  <div className="preview">
                    {videoTipo === "youtube" ? (
                      <iframe src={convertirYouTubeEmbed(urlVideo)} title="preview" frameBorder="0" allowFullScreen />
                    ) : (
                      <video src={urlVideo} controls />
                    )}
                  </div>
                )}

                <div className="modal-actions">
                  <button className="guardar-btn" onClick={guardarModal} disabled={loading}>
                    <FaCheck /> {loading ? "Guardando..." : "Guardar"}
                  </button>
                  <button className="cancelar-btn" onClick={cerrarModal}>
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
