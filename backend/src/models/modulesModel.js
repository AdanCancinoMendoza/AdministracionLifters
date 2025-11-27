// backend/src/models/modulesModel.js
import db from "../config/db.js";

export async function createModule(id_competencia, title, pass_number = 1, position = 0, meta = null, status = null) {
  // Si status es null, la DB usará el DEFAULT 'idle'
  const [res] = await db.query(
    "INSERT INTO modules (id_competencia, title, pass_number, position, meta, status) VALUES (?, ?, ?, ?, ?, ?)",
    [id_competencia, title, pass_number, position, meta ? JSON.stringify(meta) : null, status]
  );
  return res.insertId;
}

export async function getModulesByCompetition(id_competencia) {
  const [rows] = await db.query("SELECT * FROM modules WHERE id_competencia = ? ORDER BY position, id", [id_competencia]);
  return rows;
}

export async function getModuleById(id) {
  const [rows] = await db.query("SELECT * FROM modules WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function updateModule(id, data = {}) {
  const fields = [];
  const params = [];
  if (data.title != null) { fields.push("title = ?"); params.push(data.title); }
  if (data.pass_number != null) { fields.push("pass_number = ?"); params.push(data.pass_number); }
  if (data.position != null) { fields.push("position = ?"); params.push(data.position); }
  if (data.meta != null) { fields.push("meta = ?"); params.push(JSON.stringify(data.meta)); }

  // Nuevos campos soportados
  if (data.status != null) { fields.push("status = ?"); params.push(data.status); }
  if (data.last_event_at != null) { fields.push("last_event_at = ?"); params.push(data.last_event_at); } // expect JS Date or string
  if (data.last_payload != null) { fields.push("last_payload = ?"); params.push(typeof data.last_payload === "string" ? data.last_payload : JSON.stringify(data.last_payload)); }

  if (fields.length === 0) return;
  params.push(id);
  await db.query(`UPDATE modules SET ${fields.join(", ")} WHERE id = ?`, params);
}

// Helper: actualizar sólo status / payload de forma directa
export async function setModuleStatus(module_id, status, payload = null) {
  const params = [status, module_id];
  if (payload == null) {
    await db.query("UPDATE modules SET status = ? WHERE id = ?", params);
  } else {
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    // actualizamos status, last_payload y last_event_at
    await db.query("UPDATE modules SET status = ?, last_payload = ?, last_event_at = NOW() WHERE id = ?", [status, payloadStr, module_id]);
  }
}

export async function deleteModule(module_id) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM module_assignments WHERE module_id = ?", [module_id]);
    await conn.query("DELETE FROM module_runs WHERE module_id = ?", [module_id]);
    await conn.query("DELETE FROM modules WHERE id = ?", [module_id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
