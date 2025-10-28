// controllers/ordenController.js
import {
  saveOrdenItems,
  getOrdenByCompetencia,
  savePesosAsignados,
  startParticipante,
  pauseParticipante,
  resumeParticipante,
  nextParticipante,
  getOrdenConPesosByCompetencia, 


} from "../models/ordenModel.js";

/** Crear / reemplazar orden */
export const crearOrdenController = async (req, res) => {
  try {
    const { id } = req.params; // id_competencia
    const { orden } = req.body;
    if (!id) return res.status(400).json({ error: "id de competencia requerido (params)" });
    if (!Array.isArray(orden) || orden.length === 0) return res.status(400).json({ error: "orden (array) es requerido" });

    // validación básica de cada item
    for (const item of orden) {
      if (!item.id_competidor || typeof item.orden === "undefined") {
        return res.status(400).json({ error: "cada item debe tener id_competidor y orden" });
      }
    }

    await saveOrdenItems(Number(id), orden);
    res.status(201).json({ message: "Orden guardada correctamente" });
  } catch (error) {
    console.error("Error crearOrdenController:", error);
    res.status(500).json({ error: "Error al guardar la orden" });
  }
};

/** Obtener orden por competencia */
export const obtenerOrdenController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id competencia requerido" });
    const rows = await getOrdenByCompetencia(Number(id));
    res.json(rows);
  } catch (error) {
    console.error("Error obtenerOrdenController:", error);
    res.status(500).json({ error: "Error al obtener orden" });
  }
};

/** Guardar pesos (bulk) */
export const guardarPesosController = async (req, res) => {
  try {
    const { id } = req.params; // id_competencia
    const { pesos } = req.body;
    if (!id) return res.status(400).json({ error: "id competencia requerido (params)" });
    if (!Array.isArray(pesos) || pesos.length === 0) return res.status(400).json({ error: "pesos (array) requerido" });

    // validación mínima
    for (const p of pesos) {
      if (!p.id_competidor || !p.id_ejercicio || !p.intento) {
        return res.status(400).json({ error: "cada peso debe tener id_competidor, id_ejercicio e intento" });
      }
    }

    await savePesosAsignados(pesos);
    res.status(201).json({ message: "Pesos guardados correctamente" });
  } catch (error) {
    console.error("Error guardarPesosController:", error);
    res.status(500).json({ error: "Error al guardar pesos" });
  }
};

/** Control de orden (start/pause/resume/next) */
export const controlOrdenController = async (req, res) => {
  try {
    const { id, id_competidor, action } = req.params;
    if (!id || !id_competidor || !action) return res.status(400).json({ error: "parametros id, id_competidor y action son requeridos" });

    const valid = ["start", "pause", "resume", "next"];
    if (!valid.includes(action)) return res.status(400).json({ error: "action inválida" });

    if (action === "start") {
      await startParticipante(Number(id), Number(id_competidor));
      return res.json({ message: "Participante iniciado" });
    }
    if (action === "pause") {
      await pauseParticipante(Number(id), Number(id_competidor));
      return res.json({ message: "Participante pausado" });
    }
    if (action === "resume") {
      await resumeParticipante(Number(id), Number(id_competidor));
      return res.json({ message: "Participante reanudado" });
    }
    if (action === "next") {
      const next = await nextParticipante(Number(id), Number(id_competidor));
      return res.json({ message: "Siguiente ejecutado", next });
    }

    res.status(400).json({ error: "acción no manejada" });
  } catch (error) {
    console.error("Error controlOrdenController:", error);
    res.status(500).json({ error: "Error en control de orden" });
  }
};

/** Obtener orden + pesos asignados */
export const obtenerOrdenConPesosController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id competencia requerido" });

    const data = await getOrdenConPesosByCompetencia(Number(id));
    res.json(data);
  } catch (error) {
    console.error("Error obtenerOrdenConPesosController:", error);
    res.status(500).json({ error: "Error al obtener orden con pesos" });
  }
};
