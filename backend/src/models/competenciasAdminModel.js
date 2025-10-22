import db from "../config/db.js";

// Crear competencia
export const crearCompetencia = async (data) => {
  const sql = `
    INSERT INTO competenciasadmin 
    (nombre, tipo, foto, fecha_inicio, fecha_cierre, fecha_evento, categoria, costo, ubicacion, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    data.nombre,
    data.tipo,
    data.foto || null,
    data.fecha_inicio || null,
    data.fecha_cierre || null,
    data.fecha_evento || null,
    data.categoria,
    data.costo || 0,
    data.ubicacion || null,
    data.lat || null,
    data.lng || null,
  ]);
  return result.insertId;
};

// Obtener todas
export const obtenerCompetencias = async () => {
  const [rows] = await db.query("SELECT * FROM competenciasadmin");
  return rows;
};

// Obtener por ID
export const obtenerCompetenciaPorId = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM competenciasadmin WHERE id_competencia = ?",
    [id]
  );
  return rows[0];
};

// Eliminar por ID
export const eliminarCompetencia = async (id) => {
  const [result] = await db.query(
    "DELETE FROM competenciasadmin WHERE id_competencia = ?",
    [id]
  );
  return result.affectedRows;
};

// Actualizar por ID
export const editarCompetencia = async (id, data) => {
  const sql = `
    UPDATE competenciasadmin SET
      nombre = ?, tipo = ?, foto = ?, fecha_inicio = ?, fecha_cierre = ?, 
      fecha_evento = ?, categoria = ?, costo = ?, ubicacion = ?, lat = ?, lng = ?
    WHERE id_competencia = ?
  `;
  const [result] = await db.query(sql, [
    data.nombre,
    data.tipo,
    data.foto || null,
    data.fecha_inicio || null,
    data.fecha_cierre || null,
    data.fecha_evento || null,
    data.categoria,
    data.costo || 0,
    data.ubicacion || null,
    data.lat || null,
    data.lng || null,
    id,
  ]);
  return result.affectedRows;
};
