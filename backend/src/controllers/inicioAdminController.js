import { obtenerInicio, actualizarInicio } from "../models/inicioAdminModel.js";

// Obtener datos de inicio
export const getInicio = async (req, res) => {
  try {
    const data = await obtenerInicio();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener datos", error });
  }
};

// Actualizar texto e imagen
export const updateInicio = async (req, res) => {
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);

  try {
    const texto = req.body.texto || null;
    let imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    console.log("Texto a guardar:", texto);
    console.log("Imagen a guardar:", imagenUrl);

    await actualizarInicio(texto, imagenUrl);

    res.json({ message: "Datos actualizados correctamente", imagenUrl });
  } catch (error) {
    console.error("Error en updateInicio:", error);
    res.status(500).json({ message: "Error al actualizar los datos", error: error.message });
  }
};


