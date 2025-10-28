// src/controllers/videosAdminController.js
import {
  obtenerVideos,
  crearVideo,
  actualizarVideo,
  eliminarVideo,
} from "../models/videosAdminModel.js";

/**
 * GET: obtener todos los videos
 */
export const getVideos = async (req, res) => {
  try {
    const videos = await obtenerVideos();
    return res.json(videos);
  } catch (error) {
    console.error("Error al obtener los videos:", error);
    return res.status(500).json({ message: "Error al obtener los videos" });
  }
};

/**
 * POST: crear nuevo video
 * Acepta:
 *  - archivo en field 'videoLocal' (multer) => videoLocal = '/uploads/filename'
 *  - o youtube en req.body.tipo === 'youtube' y req.body.src || req.body.linkVideo
 */
export const createVideo = async (req, res) => {
  try {
    let linkVideo = null;
    let videoLocal = null;

    // Si Multer subió un archivo local
    if (req.file) {
      videoLocal = `/uploads/${req.file.filename}`;
    }

    // Aceptar ambos nombres de campo (src o linkVideo)
    const linkFromBody = req.body.src ?? req.body.linkVideo ?? null;
    if ((req.body.tipo === "youtube" || linkFromBody) && linkFromBody) {
      linkVideo = linkFromBody;
    }

    if (!linkVideo && !videoLocal) {
      return res.status(400).json({ message: "Debes proporcionar un link de YouTube o subir un archivo de video." });
    }

    const newId = await crearVideo(linkVideo, videoLocal);

    return res.status(201).json({
      message: "Video agregado correctamente",
      id: newId,
      linkVideo,
      videoLocal,
    });
  } catch (error) {
    console.error("Error al agregar el video:", error);
    return res.status(500).json({ message: "Error al agregar el video", error: error.message });
  }
};

/**
 * PUT: actualizar video existente
 * Comportamiento:
 *  - Si viene archivo (req.file) => actualiza videoLocal
 *  - Si viene link (req.body.linkVideo o req.body.src) => actualiza linkVideo
 *  - Si no viene campo para un valor, conserva el valor existente en DB
 */
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID de video requerido" });

    // Obtener registro existente (usamos obtenerVideos y buscamos por id)
    const all = await obtenerVideos();
    const existing = all.find((v) => String(v.id) === String(id));

    if (!existing) {
      return res.status(404).json({ message: "Video no encontrado" });
    }

    // Valores actuales
    const currentLink = existing.linkVideo ?? null;
    const currentLocal = existing.videoLocal ?? null;

    // Nuevo videoLocal si se subió archivo
    let videoLocal = currentLocal;
    if (req.file) {
      videoLocal = `/uploads/${req.file.filename}`;
    }

    // Nuevo linkVideo si viene en body (aceptar src o linkVideo)
    const linkFromBody = req.body.linkVideo ?? req.body.src ?? null;
    const linkVideo = linkFromBody ?? currentLink;

    // Si no hubo cambio (ni archivo ni link) devolvemos un 400 o simplemente respondemos que no hubo cambios.
    if (!req.file && !linkFromBody) {
      // No se proporcionó nada a actualizar: conservar y devolver el estado actual
      return res.status(200).json({
        message: "No se proporcionaron cambios. Registro sin modificaciones.",
        id: existing.id,
        linkVideo: currentLink,
        videoLocal: currentLocal,
      });
    }

    // Actualizar la fila con los valores decididos
    const affected = await actualizarVideo(id, linkVideo, videoLocal);

    if (!affected) {
      return res.status(500).json({ message: "No se pudo actualizar el video" });
    }

    return res.json({
      message: "Video actualizado correctamente",
      id: Number(id),
      linkVideo,
      videoLocal,
    });
  } catch (error) {
    console.error("Error al actualizar video:", error);
    return res.status(500).json({ message: "Error al actualizar video", error: error.message });
  }
};

/**
 * DELETE: eliminar video
 */
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID de video requerido" });

    const affected = await eliminarVideo(id);
    if (!affected) {
      return res.status(404).json({ message: "Video no encontrado o ya eliminado" });
    }

    return res.json({ message: "Video eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar video:", error);
    return res.status(500).json({ message: "Error al eliminar video" });
  }
};
