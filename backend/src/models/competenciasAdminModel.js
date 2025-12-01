// models/competenciasAdminModel.js
import db from "../config/db.js";

// Helper para normalizar número o null
const numOrNull = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

export const crearCompetencia = async (data) => {
  const sql = `
    INSERT INTO competenciasadmin 
    (nombre, tipo, foto, fecha_inicio, fecha_cierre, fecha_evento, categoria, costo, ubicacion, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    data.nombre ?? null,
    data.tipo ?? null,
    data.foto ?? null,
    data.fecha_inicio ?? null,
    data.fecha_cierre ?? null,
    data.fecha_evento ?? null,
    data.categoria ?? null,
    data.costo !== undefined && data.costo !== null && data.costo !== "" ? Number(data.costo) : 0,
    data.ubicacion ?? null,
    numOrNull(data.lat),
    numOrNull(data.lng),
  ]);
  return result.insertId;
};

export const obtenerCompetencias = async () => {
  const [rows] = await db.query("SELECT * FROM competenciasadmin");
  return rows;
};

export const obtenerCompetenciaPorId = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM competenciasadmin WHERE id_competencia = ?",
    [id]
  );
  return rows[0];
};

export const eliminarCompetencia = async (id) => {
  const [result] = await db.query(
    "DELETE FROM competenciasadmin WHERE id_competencia = ?",
    [id]
  );
  return result.affectedRows;
};

export const editarCompetencia = async (id, data) => {
  const sql = `
    UPDATE competenciasadmin SET
      nombre = ?, tipo = ?, foto = ?, fecha_inicio = ?, fecha_cierre = ?, 
      fecha_evento = ?, categoria = ?, costo = ?, ubicacion = ?, lat = ?, lng = ?
    WHERE id_competencia = ?
  `;
  const [result] = await db.query(sql, [
    data.nombre ?? null,
    data.tipo ?? null,
    data.foto ?? null,
    data.fecha_inicio ?? null,
    data.fecha_cierre ?? null,
    data.fecha_evento ?? null,
    data.categoria ?? null,
    data.costo !== undefined && data.costo !== null && data.costo !== "" ? Number(data.costo) : 0,
    data.ubicacion ?? null,
    numOrNull(data.lat),
    numOrNull(data.lng),
    id,
  ]);
  return result.affectedRows;
};
