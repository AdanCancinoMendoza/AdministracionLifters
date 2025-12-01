// controllers/competenciasAdminController.js
import {
  crearCompetencia,
  obtenerCompetencias,
  obtenerCompetenciaPorId,
  eliminarCompetencia,
  editarCompetencia,
} from "../models/competenciasAdminModel.js";

// Helper: normalizar número o null
const numOrNull = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

// Crear
export const crearCompetenciaController = async (req, res) => {
  try {
    // Si multer está en la ruta, req.file contendrá la foto
    const foto = req.file ? `/uploads/${req.file.filename}` : null;

    // Normalizar campos importantes
    const lat = numOrNull(req.body.lat);
    const lng = numOrNull(req.body.lng);
    const costo =
      req.body.costo !== undefined && req.body.costo !== null && req.body.costo !== ""
        ? Number(req.body.costo)
        : 0;

    let ubicacion = req.body.ubicacion ?? null;
    if (lat !== null && lng !== null) {
      // Si lat/lng vienen, podemos fijar ubicacion consistente
      ubicacion = `Lat: ${lat}, Lng: ${lng}`;
    }

    const data = {
      ...req.body,
      foto,
      lat,
      lng,
      costo,
      ubicacion,
    };

    console.log("POST /competenciasadmin - crear data:", data);

    const id = await crearCompetencia(data);
    res.status(201).json({ message: "Competencia creada correctamente", id });
  } catch (error) {
    console.error("❌ Error al crear competencia:", error);
    res.status(500).json({ error: "Error al crear la competencia" });
  }
};

// Obtener todas
export const obtenerCompetenciasController = async (req, res) => {
  try {
    const competencias = await obtenerCompetencias();
    res.json(competencias);
  } catch (error) {
    console.error("❌ Error al obtener competencias:", error);
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
    console.error("❌ Error al obtener competencia por id:", error);
    res.status(500).json({ error: "Error al obtener la competencia" });
  }
};

// Actualizar competencia
export const actualizarCompetenciaController = async (req, res) => {
  try {
    const { id } = req.params;

    // Traer la competencia actual
    const competenciaActual = await obtenerCompetenciaPorId(id);
    if (!competenciaActual) {
      return res.status(404).json({ error: "Competencia no encontrada" });
    }

    // Foto: si llega nueva foto la usamos, si no, conservamos la anterior
    const foto = req.file ? `/uploads/${req.file.filename}` : competenciaActual.foto;

    // Normalizar lat/lng/costo
    const lat = numOrNull(req.body.lat);
    const lng = numOrNull(req.body.lng);
    const costo =
      req.body.costo !== undefined && req.body.costo !== null && req.body.costo !== ""
        ? Number(req.body.costo)
        : competenciaActual.costo ?? 0;

    // Ubicación: si lat y lng existen, crear ubicacion consistente; si no, usar la enviada o la existente
    let ubicacion = req.body.ubicacion ?? competenciaActual.ubicacion ?? null;
    if (lat !== null && lng !== null) {
      ubicacion = `Lat: ${lat}, Lng: ${lng}`;
    }

    // Preparar objeto con los datos normalizados que pasaremos al modelo
    const data = {
      nombre: req.body.nombre ?? competenciaActual.nombre,
      tipo: req.body.tipo ?? competenciaActual.tipo,
      categoria: req.body.categoria ?? competenciaActual.categoria,
      costo,
      ubicacion,
      lat,
      lng,
      fecha_inicio: req.body.fecha_inicio ?? competenciaActual.fecha_inicio,
      fecha_cierre: req.body.fecha_cierre ?? competenciaActual.fecha_cierre,
      fecha_evento: req.body.fecha_evento ?? competenciaActual.fecha_evento,
      foto,
    };

    console.log("PUT /competenciasadmin/:id - data normalizada:", { id, data });

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
    console.error("❌ Error al eliminar competencia:", error);
    res.status(500).json({ error: "Error al eliminar la competencia" });
  }
};
