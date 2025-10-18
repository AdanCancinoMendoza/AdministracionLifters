import db from "../config/db.js";

// Crear una nueva publicación
export const crearPublicacion = async (data) => {
  const sql = `
    INSERT INTO publicacionesadmin 
    (Tipo, Contenido, Titulo, Descripcion, Categoria, Fecha)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    data.Tipo,
    data.Contenido,
    data.Titulo,
    data.Descripcion,
    data.Categoria,
    data.Fecha,
  ]);

  return result.insertId;
};

// Obtener todas las publicaciones
export const obtenerPublicaciones = async () => {
  const [rows] = await db.query("SELECT * FROM publicacionesadmin ORDER BY FechaCreacion DESC");
  return rows;
};

// Obtener una publicación por ID
export const obtenerPublicacionPorId = async (id) => {
  const [rows] = await db.query("SELECT * FROM publicacionesadmin WHERE ID = ?", [id]);
  return rows[0];
};

// Actualizar una publicación
export const actualizarPublicacion = async (id, data) => {
  const sql = `
    UPDATE publicacionesadmin
    SET Tipo = ?, Contenido = ?, Titulo = ?, Descripcion = ?, Categoria = ?, Fecha = ?
    WHERE ID = ?
  `;

  const [result] = await db.query(sql, [
    data.Tipo,
    data.Contenido,
    data.Titulo,
    data.Descripcion,
    data.Categoria,
    data.Fecha,
    id,
  ]);

  return result.affectedRows;
};

// Eliminar una publicación
export const eliminarPublicacion = async (id) => {
  const [result] = await db.query("DELETE FROM publicacionesadmin WHERE ID = ?", [id]);
  return result.affectedRows;
};
