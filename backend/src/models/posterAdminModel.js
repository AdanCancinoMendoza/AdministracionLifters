import db from "../config/db.js";

// Obtener datos de inicio (solo 1 registro)
export const obtenerPoster = async () => {
  const [rows] = await db.query("SELECT * FROM poster LIMIT 1");
  return rows[0];
};

// Actualizar imagen
export const actualizarPoster = async (imagen_url) => {
  const query = `
    UPDATE poster
    SET imagen_url = ?, fecha_actualizacion = NOW()
    WHERE ID = 1
  `;
  console.log("Query:", query, "Params:", [imagen_url]);
  await db.query(query, [imagen_url]);
};