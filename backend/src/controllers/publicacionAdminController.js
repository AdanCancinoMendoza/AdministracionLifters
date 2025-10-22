import {
  crearPublicacion,
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  actualizarPublicacion,
  eliminarPublicacion,
} from "../models/publicacionAdminModel.js";

// Crear publicación
export const crearPublicacionController = async (req, res) => {
  try {
    // Si hay archivo subido, guarda su ruta
    const contenido = req.file ? `/uploads/${req.file.filename}` : req.body.Contenido;

    const data = {
      Tipo: req.body.Tipo,
      Contenido: contenido,
      Titulo: req.body.Titulo,
      Descripcion: req.body.Descripcion,
      Categoria: req.body.Categoria,
      Fecha: req.body.Fecha,
    };

    const id = await crearPublicacion(data);
    res.status(201).json({ message: "✅ Publicación creada correctamente", id });
  } catch (error) {
    console.error("❌ Error en crearPublicacionController:", error);
    res.status(500).json({ error: "Error al crear la publicación" });
  }
};

// Obtener todas las publicaciones
export const obtenerPublicacionesController = async (req, res) => {
  try {
    const publicaciones = await obtenerPublicaciones();
    res.json(publicaciones);
  } catch (error) {
    console.error("❌ Error al obtener publicaciones:", error);
    res.status(500).json({ error: "Error al obtener las publicaciones" });
  }
};

// Obtener una publicación por ID
export const obtenerPublicacionPorIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const publicacion = await obtenerPublicacionPorId(id);

    if (!publicacion) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    res.json(publicacion);
  } catch (error) {
    console.error("❌ Error al obtener publicación por ID:", error);
    res.status(500).json({ error: "Error al obtener la publicación" });
  }
};

// Actualizar publicación
export const actualizarPublicacionController = async (req, res) => {
  try {
    const { id } = req.params;
    const contenido = req.file ? `/uploads/${req.file.filename}` : req.body.Contenido;

    const data = {
      Tipo: req.body.Tipo,
      Contenido: contenido,
      Titulo: req.body.Titulo,
      Descripcion: req.body.Descripcion,
      Categoria: req.body.Categoria,
      Fecha: req.body.Fecha,
    };

    const result = await actualizarPublicacion(id, data);

    if (result === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    res.json({ message: "✅ Publicación actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar publicación:", error);
    res.status(500).json({ error: "Error al actualizar la publicación" });
  }
};

// Eliminar publicación
export const eliminarPublicacionController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eliminarPublicacion(id);

    if (result === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    res.json({ message: "🗑️ Publicación eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar publicación:", error);
    res.status(500).json({ error: "Error al eliminar la publicación" });
  }
};
