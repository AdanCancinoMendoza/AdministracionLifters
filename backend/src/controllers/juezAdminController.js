import {
  crearJuez,
  obtenerJueces,
  obtenerJuecesPorCompetencia,
  obtenerJuezPorId,
  editarJuez,
  eliminarJuez
} from "../models/juezAdminModel.js";

// Crear juez
export const crearJuezController = async (req, res) => {
  try {
    const { id_competencia, nombre, apellidos, usuario, password } = req.body;

    if (!id_competencia) {
      return res.status(400).json({ error: "El campo id_competencia es obligatorio" });
    }

    const juezCreado = await crearJuez({ id_competencia, nombre, apellidos, usuario, password });

    res.status(201).json(juezCreado);
  } catch (error) {
    console.error("❌ Error al crear juez:", error);
    res.status(500).json({ error: "Error al crear juez" });
  }
};


// Obtener todos los jueces
export const obtenerJuecesController = async (req, res) => {
  try {
    const jueces = await obtenerJueces();
    res.json(jueces);
  } catch (error) {
    console.error("❌ Error al obtener jueces:", error);
    res.status(500).json({ error: "Error al obtener jueces" });
  }
};

// Obtener jueces por competencia
export const obtenerJuecesPorCompetenciaController = async (req, res) => {
  try {
    const { id_competencia } = req.params;
    const jueces = await obtenerJuecesPorCompetencia(id_competencia);
    res.json(jueces);
  } catch (error) {
    console.error("❌ Error al obtener jueces por competencia:", error);
    res.status(500).json({ error: "Error al obtener jueces" });
  }
};

// Obtener juez por ID
export const obtenerJuezController = async (req, res) => {
  try {
    const { id } = req.params;
    const juez = await obtenerJuezPorId(id);
    if (!juez) return res.status(404).json({ error: "Juez no encontrado" });
    res.json(juez);
  } catch (error) {
    console.error("❌ Error al obtener juez:", error);
    res.status(500).json({ error: "Error al obtener juez" });
  }
};

// Actualizar juez
export const actualizarJuezController = async (req, res) => {
  try {
    const { id } = req.params;
    const filas = await editarJuez(id, req.body);
    if (filas > 0) res.json({ message: "Juez actualizado" });
    else res.status(404).json({ error: "Juez no encontrado" });
  } catch (error) {
    console.error("❌ Error al actualizar juez:", error);
    res.status(500).json({ error: "Error al actualizar juez" });
  }
};

// Eliminar juez
export const eliminarJuezController = async (req, res) => {
  try {
    const { id } = req.params;
    const filas = await eliminarJuez(id);
    if (filas > 0) res.json({ message: "Juez eliminado" });
    else res.status(404).json({ error: "Juez no encontrado" });
  } catch (error) {
    console.error("❌ Error al eliminar juez:", error);
    res.status(500).json({ error: "Error al eliminar juez" });
  }
};
