// backend/src/controllers/categoriasAdminController.js
import { getCategoriasWithGanadores, saveCategoriaAndGanadores } from "../models/categoriasAdminModel.js";

// Obtener todas las categorías con sus ganadores
export const getCategorias = async (req, res) => {
  try {
    const categorias = await getCategoriasWithGanadores();
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener categorías con ganadores:", error);
    res.status(500).json({ message: "Error al obtener las categorías", error: error.message });
  }
};

// Guardar/Actualizar categorías y ganadores (maneja el POST del frontend)
export const saveCategorias = async (req, res) => {
  // El frontend envía 'categorias' como un string JSON
  const categoriasData = JSON.parse(req.body.categorias);
  const files = req.files; // req.files contiene los archivos subidos por Multer.

  console.log("Datos de categorías recibidos (controlador):", categoriasData);
  console.log("Archivos recibidos (controlador):", files);

  try {
    for (const cat of categoriasData) {
      let imagenUrl = undefined; // Usamos undefined para indicar que no hay nueva imagen por defecto

      // --- Procesar Imagen si se ha subido una nueva ---
      // El frontend envía los archivos con fieldnames como 'imagen-<id>' o 'imagen-new-<index>'
      const fileKey = `imagen-${cat.id || `new-${categoriasData.indexOf(cat)}`}`;
      let uploadedFile = null;

      // `req.files` es un array si Multer usa `.any()`
      if (Array.isArray(files)) {
        uploadedFile = files.find(f => f.fieldname === fileKey);
      } else if (files && files[fileKey] && files[fileKey].length > 0) {
         // Si Multer usa `.fields()` y req.files es un objeto { 'imagen-1': [...], ... }
        uploadedFile = files[fileKey][0];
      }

      if (uploadedFile) {
        imagenUrl = `/uploads/${uploadedFile.filename}`;
      }

      // Llama a la función del modelo para guardar esta categoría y sus ganadores
      await saveCategoriaAndGanadores(cat, imagenUrl);
    }

    res.json({ message: "Categorías y ganadores guardados correctamente." });
  } catch (error) {
    console.error("Error al guardar categorías y ganadores en el controlador:", error);
    res.status(500).json({ message: "Error al guardar los datos", error: error.message });
  }
};