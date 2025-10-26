import db from "../config/db.js";

/**
 * Crea un live stream y devuelve el insertId
 * data: { id_competencia, youtube_url, title, active, start_datetime }
 */
export const createLiveStream = async (data) => {
  const sql = `
    INSERT INTO live_streams
      (id_competencia, youtube_url, title, active, start_datetime)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    data.id_competencia,
    data.youtube_url,
    data.title || null,
    data.active ? 1 : 0,
    data.start_datetime || null,
  ]);
  return result.insertId;
};

export const getLiveStreams = async () => {
  const [rows] = await db.query(`
    SELECT ls.*, comp.nombre AS nombre_competencia
    FROM live_streams ls
    LEFT JOIN competenciasadmin comp ON ls.id_competencia = comp.id_competencia
    ORDER BY ls.created_at DESC
  `);
  return rows;
};

export const getLiveStreamById = async (id) => {
  const [rows] = await db.query(`
    SELECT ls.*, comp.nombre AS nombre_competencia
    FROM live_streams ls
    LEFT JOIN competenciasadmin comp ON ls.id_competencia = comp.id_competencia
    WHERE ls.id_live = ?
    LIMIT 1
  `, [id]);
  return rows[0];
};

export const updateLiveStream = async (id, data) => {
  const sql = `
    UPDATE live_streams
    SET id_competencia = ?, youtube_url = ?, title = ?, active = ?, start_datetime = ?
    WHERE id_live = ?
  `;
  await db.query(sql, [
    data.id_competencia,
    data.youtube_url,
    data.title || null,
    data.active ? 1 : 0,
    data.start_datetime || null,
    id,
  ]);
};

export const deleteLiveStream = async (id) => {
  await db.query(`DELETE FROM live_streams WHERE id_live = ?`, [id]);
};

/**
 * Obtiene streams activos:
 * Por defecto devuelve active = 1 y start_datetime <= NOW() OR start_datetime IS NULL
 */
export const getActiveLiveStreams = async () => {
  const [rows] = await db.query(`
    SELECT ls.*, comp.nombre AS nombre_competencia
    FROM live_streams ls
    LEFT JOIN competenciasadmin comp ON ls.id_competencia = comp.id_competencia
    WHERE ls.active = 1
      AND (ls.start_datetime IS NULL OR ls.start_datetime <= NOW())
    ORDER BY ls.start_datetime ASC, ls.created_at DESC
  `);
  return rows;
};

/**
 * Desactiva todos los streams de una competencia (set active = 0)
 */
export const deactivateStreamsByCompetition = async (id_competencia) => {
  await db.query(`UPDATE live_streams SET active = 0 WHERE id_competencia = ?`, [id_competencia]);
};
