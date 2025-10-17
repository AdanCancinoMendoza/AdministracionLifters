import db from "../config/db.js";

// Crear una nueva competencia
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

// Obtener todas las competencias
export const obtenerCompetencias = async () => {
  const [rows] = await db.query("SELECT * FROM competenciasadmin");
  return rows;
};
