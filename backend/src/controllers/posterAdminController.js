import { obtenerPoster, actualizarPoster } from "../models/posterAdminModel.js";

// Obtener datos del póster
export const getPoster = async (req, res) => {
  try {
    const data = await obtenerPoster();
    if (!data) {
      return res.status(404).json({ message: "No se encontró ningún póster." });
    }
    res.json(data);
  } catch (error) {
    console.error("Error al obtener el póster:", error);
    res.status(500).json({ message: "Error al obtener datos del póster", error: error.message });
  }
};

// Actualizar el póster (solo imagen)
export const updatePoster = async (req, res) => { // Cambiado de 'obtenerPoster' a 'updatePoster'
  console.log("req.file:", req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se ha subido ninguna imagen." });
    }

    let imagenUrl = `/uploads/${req.file.filename}`; 

    console.log("Imagen a guardar:", imagenUrl);

    await actualizarPoster(imagenUrl);

    res.json({ message: "Póster actualizado correctamente", imagenUrl });
  } catch (error) {
    console.error("Error al actualizar el póster:", error);
    res.status(500).json({ message: "Error al actualizar el póster", error: error.message });
  }
};