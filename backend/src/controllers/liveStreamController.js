import {
  createLiveStream,
  getLiveStreams,
  getLiveStreamById,
  updateLiveStream,
  deleteLiveStream,
  getActiveLiveStreams,
  deactivateStreamsByCompetition
} from "../models/liveStreamModel.js";

/** Util: validar URL de YouTube simple */
const isYouTubeUrl = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes("youtube.com") || host.includes("youtu.be");
  } catch (e) {
    return false;
  }
};

// Crear stream
export const crearLiveStreamController = async (req, res) => {
  try {
    const { id_competencia, youtube_url, title, active, start_datetime } = req.body;

    if (!id_competencia || !youtube_url) {
      return res.status(400).json({ error: "id_competencia y youtube_url son obligatorios" });
    }
    if (!isYouTubeUrl(youtube_url)) {
      return res.status(400).json({ error: "URL de YouTube inválida" });
    }

    // Si active == 1 desactivar otros streams de la misma competencia primero
    if (Number(active) === 1) {
      await deactivateStreamsByCompetition(id_competencia);
    }

    const id = await createLiveStream({
      id_competencia: Number(id_competencia),
      youtube_url,
      title,
      active: Number(active) === 1 ? 1 : 0,
      start_datetime: start_datetime || null,
    });

    res.status(201).json({ message: "Stream creado", id_live: id });
  } catch (error) {
    console.error("Error crearLiveStreamController:", error);
    res.status(500).json({ error: "Error al crear live stream" });
  }
};

// Obtener todos
export const obtenerLiveStreamsController = async (req, res) => {
  try {
    const rows = await getLiveStreams();
    res.json(rows);
  } catch (error) {
    console.error("Error obtenerLiveStreamsController:", error);
    res.status(500).json({ error: "Error al obtener live streams" });
  }
};

// Obtener activos (público)
export const obtenerLiveStreamsActivosController = async (req, res) => {
  try {
    const rows = await getActiveLiveStreams();
    res.json(rows);
  } catch (error) {
    console.error("Error obtenerLiveStreamsActivosController:", error);
    res.status(500).json({ error: "Error al obtener live streams activos" });
  }
};

// Obtener por ID
export const obtenerLiveStreamPorIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getLiveStreamById(id);
    if (!row) return res.status(404).json({ message: "Stream no encontrado" });
    res.json(row);
  } catch (error) {
    console.error("Error obtenerLiveStreamPorIdController:", error);
    res.status(500).json({ error: "Error al obtener el live stream" });
  }
};

// Actualizar
export const actualizarLiveStreamController = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_competencia, youtube_url, title, active, start_datetime } = req.body;

    const existing = await getLiveStreamById(id);
    if (!existing) return res.status(404).json({ message: "Stream no encontrado" });

    if (!id_competencia || !youtube_url) {
      return res.status(400).json({ error: "id_competencia y youtube_url son obligatorios" });
    }
    if (!isYouTubeUrl(youtube_url)) {
      return res.status(400).json({ error: "URL de YouTube inválida" });
    }

    // Si se activa este stream, desactivar los demás de la competencia primero
    if (Number(active) === 1) {
      await deactivateStreamsByCompetition(Number(id_competencia));
    }

    await updateLiveStream(id, {
      id_competencia: Number(id_competencia),
      youtube_url,
      title,
      active: Number(active) === 1 ? 1 : 0,
      start_datetime: start_datetime || null,
    });

    res.json({ message: "Stream actualizado correctamente" });
  } catch (error) {
    console.error("Error actualizarLiveStreamController:", error);
    res.status(500).json({ error: "Error al actualizar el live stream" });
  }
};

// Eliminar
export const eliminarLiveStreamController = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getLiveStreamById(id);
    if (!existing) return res.status(404).json({ message: "Stream no encontrado" });

    await deleteLiveStream(id);
    res.json({ message: "Stream eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarLiveStreamController:", error);
    res.status(500).json({ error: "Error al eliminar el live stream" });
  }
};
