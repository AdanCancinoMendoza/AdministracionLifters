import {
  obtenerVideos,
  crearVideo,
  actualizarVideo,
  eliminarVideo,
} from "../models/videosAdminModel.js";

// 📍 GET: obtener todos los videos
export const getVideos = async (req, res) => {
  try {
    const videos = await obtenerVideos();
    res.json(videos);
  } catch (error) {
    console.error("Error al obtener los videos:", error);
    res.status(500).json({ message: "Error al obtener los videos" });
  }
};

// 📍 POST: crear nuevo video
export const createVideo = async (req, res) => {
  try {
    let linkVideo = null;
    let videoLocal = null;

    // 🔹 Si Multer subió un archivo local
    if (req.file) {
      videoLocal = `/uploads/${req.file.filename}`;
    }

    // 🔹 Si viene un video de YouTube
    if (req.body.tipo === "youtube" && req.body.src) {
      linkVideo = req.body.src;
    }

    if (!linkVideo && !videoLocal) {
      return res.status(400).json({ message: "Debes proporcionar un link o un archivo de video." });
    }

    const newId = await crearVideo(linkVideo, videoLocal);

    res.json({
      message: "Video agregado correctamente",
      id: newId,
      linkVideo,
      videoLocal,
    });
  } catch (error) {
    console.error("Error al agregar el video:", error);
    res.status(500).json({ message: "Error al agregar el video", error: error.message });
  }
};

// 📍 PUT: actualizar video existente
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    let linkVideo = null;
    let videoLocal = null;

    // 🔹 Subida de video local
    if (req.file) {
      videoLocal = `/uploads/${req.file.filename}`;
    }

    // 🔹 Actualización de link de YouTube
    if (req.body.linkVideo) {
      linkVideo = req.body.linkVideo;
    }

    await actualizarVideo(id, linkVideo, videoLocal);
    res.json({ message: "Video actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar video:", error);
    res.status(500).json({ message: "Error al actualizar video" });
  }
};

// 📍 DELETE: eliminar video
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarVideo(id);
    res.json({ message: "Video eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar video:", error);
    res.status(500).json({ message: "Error al eliminar video" });
  }
};
