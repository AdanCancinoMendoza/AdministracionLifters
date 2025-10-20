import {
  crearCompetidor,
  obtenerCompetidores,
  obtenerCompetidorPorId,
  actualizarCompetidor,
  eliminarCompetidor,
} from "../models/competidorModel.js";

// Crear competidor
export const crearCompetidorController = async (req, res) => {
  try {
    const comprobante = req.file ? `/uploads/${req.file.filename}` : null;

    const data = {
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      peso: req.body.peso,
      edad: req.body.edad,
      categoria: req.body.categoria,
      telefono: req.body.telefono,
      correo: req.body.correo,
      pagado: req.body.pagado || "No",
      id_competencia: req.body.id_competencia,
      comprobante_pago: comprobante,
    };

    const id = await crearCompetidor(data);
    res.status(201).json({ message: "✅ Competidor registrado correctamente", id });
  } catch (error) {
    console.error("❌ Error en crearCompetidorController:", error);
    res.status(500).json({ error: "Error al registrar el competidor" });
  }
};

// Obtener todos los competidores (con nombre y foto de competencia)
export const obtenerCompetidoresController = async (req, res) => {
  try {
    const competidores = await obtenerCompetidores();

    // Ajustar URLs completas
    const baseURL = "http://localhost:3001";

    const dataFormateada = competidores.map((c) => ({
      ...c,
      comprobante_pago: c.comprobante_pago
        ? `${baseURL}${c.comprobante_pago}`
        : null,
      foto_competencia: c.foto_competencia
        ? `${baseURL}${c.foto_competencia}`
        : null,
    }));

    res.json(dataFormateada);
  } catch (error) {
    console.error("❌ Error al obtener competidores:", error);
    res.status(500).json({ error: "Error al obtener los competidores" });
  }
};

// Obtener competidor por ID
export const obtenerCompetidorPorIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const competidor = await obtenerCompetidorPorId(id);
    if (!competidor) return res.status(404).json({ message: "Competidor no encontrado" });

    const baseURL = "http://localhost:3001";
    competidor.comprobante_pago = competidor.comprobante_pago
      ? `${baseURL}${competidor.comprobante_pago}`
      : null;
    competidor.foto_competencia = competidor.foto_competencia
      ? `${baseURL}${competidor.foto_competencia}`
      : null;

    res.json(competidor);
  } catch (error) {
    console.error("❌ Error al obtener competidor:", error);
    res.status(500).json({ error: "Error al obtener el competidor" });
  }
};

// Actualizar competidor
export const actualizarCompetidorController = async (req, res) => {
  try {
    const { id } = req.params;
    const comprobante = req.file ? `/uploads/${req.file.filename}` : req.body.comprobante_pago;

    const data = {
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      peso: req.body.peso,
      edad: req.body.edad,
      categoria: req.body.categoria,
      telefono: req.body.telefono,
      correo: req.body.correo,
      pagado: req.body.pagado,
      id_competencia: req.body.id_competencia,
      comprobante_pago: comprobante,
    };

    await actualizarCompetidor(id, data);
    res.json({ message: "✅ Competidor actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar competidor:", error);
    res.status(500).json({ error: "Error al actualizar el competidor" });
  }
};

// Eliminar competidor
export const eliminarCompetidorController = async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarCompetidor(id);
    res.json({ message: "✅ Competidor eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar competidor:", error);
    res.status(500).json({ error: "Error al eliminar el competidor" });
  }
};
