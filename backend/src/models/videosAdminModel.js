import db from "../config/db.js";

// 🔹 Obtener todos los videos
export const obtenerVideos = async () => {
  const [rows] = await db.query("SELECT * FROM videosinicio ORDER BY fechaPublicacion DESC");
  return rows;
};

// 🔹 Crear un nuevo video
export const crearVideo = async (linkVideo, videoLocal) => {
  const query = `
    INSERT INTO videosinicio (linkVideo, videoLocal)
    VALUES (?, ?)
  `;
  const [result] = await db.query(query, [linkVideo, videoLocal]);
  return result.insertId; // devuelve el ID del nuevo registro
};

// 🔹 Actualizar video existente
export const actualizarVideo = async (id, linkVideo, videoLocal) => {
  const query = `
    UPDATE videosinicio
    SET linkVideo = ?, videoLocal = ?
    WHERE id = ?
  `;
  const [result] = await db.query(query, [linkVideo, videoLocal, id]);
  return result.affectedRows;
};

// 🔹 Eliminar video
export const eliminarVideo = async (id) => {
  const query = `DELETE FROM videosinicio WHERE id = ?`;
  const [result] = await db.query(query, [id]);
  return result.affectedRows;
};
