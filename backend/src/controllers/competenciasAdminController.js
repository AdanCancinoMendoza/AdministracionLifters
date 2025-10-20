import {
  crearCompetencia,
  obtenerCompetencias,
  obtenerCompetenciaPorId,
  eliminarCompetencia,
  editarCompetencia,
} from "../models/competenciasAdminModel.js";

// Crear
export const crearCompetenciaController = async (req, res) => {
  try {
    const foto = req.file ? `/uploads/${req.file.filename}` : null;
    const data = { ...req.body, foto };
    const id = await crearCompetencia(data);
    res.status(201).json({ message: "Competencia creada correctamente", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la competencia" });
  }
};

// Obtener todas
export const obtenerCompetenciasController = async (req, res) => {
  try {
    const competencias = await obtenerCompetencias();
    res.json(competencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las competencias" });
  }
};

// Obtener por ID
export const obtenerCompetenciaController = async (req, res) => {
  try {
    const { id } = req.params;
    const competencia = await obtenerCompetenciaPorId(id);
    if (!competencia) return res.status(404).json({ error: "Competencia no encontrada" });
    res.json(competencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la competencia" });
  }
};

//  Actualizar competencia 
export const actualizarCompetenciaController = async (req, res) => {
  try {
    const { id } = req.params;

    // Traer la competencia actual
    const competenciaActual = await obtenerCompetenciaPorId(id);
    if (!competenciaActual) {
      return res.status(404).json({ error: "Competencia no encontrada" });
    }

    // Si hay nueva foto, úsala. Si no, conserva la anterior.
    const foto = req.file
      ? `/uploads/${req.file.filename}`
      : competenciaActual.foto;

    // Preparar datos actualizados
    const data = { ...req.body, foto };

    const filas = await editarCompetencia(id, data);

    if (filas > 0) {
      res.json({ message: "Competencia actualizada correctamente" });
    } else {
      res.status(400).json({ error: "No se pudo actualizar la competencia" });
    }
  } catch (error) {
    console.error("❌ Error al actualizar competencia:", error);
    res.status(500).json({ error: "Error al actualizar la competencia" });
  }
};


// Eliminar
export const eliminarCompetenciaController = async (req, res) => {
  try {
    const { id } = req.params;
    const filas = await eliminarCompetencia(id);
    if (filas > 0) res.json({ message: "Competencia eliminada" });
    else res.status(404).json({ error: "Competencia no encontrada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la competencia" });
  }
};
