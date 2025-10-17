import { crearCompetencia, obtenerCompetencias } from "../models/competenciasAdminModel.js";

// Crear competencia
export const crearCompetenciaController = async (req, res) => {
  try {
    const foto = req.file ? `/uploads/${req.file.filename}` : null;
    const data = { ...req.body, foto };

    const id = await crearCompetencia(data);
    res.status(201).json({ message: "Competencia creada correctamente", id });
  } catch (error) {
    console.error("❌ Error en crearCompetenciaController:", error);
    res.status(500).json({ error: "Error al crear la competencia" });
  }
};

// Obtener todas las competencias
export const obtenerCompetenciasController = async (req, res) => {
  try {
    const competencias = await obtenerCompetencias();
    res.json(competencias);
  } catch (error) {
    console.error("❌ Error al obtener competencias:", error);
    res.status(500).json({ error: "Error al obtener las competencias" });
  }
};
