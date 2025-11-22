// backend/src/models/modulesModel.js
import db from "../config/db.js";

export async function createModule(id_competencia, title, pass_number = 1, position = 0, meta = null) {
  const [res] = await db.query(
    "INSERT INTO modules (id_competencia, title, pass_number, position, meta) VALUES (?, ?, ?, ?, ?)",
    [id_competencia, title, pass_number, position, meta ? JSON.stringify(meta) : null]
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

export async function deleteModule(id) {
  await db.query("DELETE FROM modules WHERE id = ?", [id]);
}

export async function updateModule(id, data = {}) {
  const fields = [];
  const params = [];
  if (data.title != null) { fields.push("title = ?"); params.push(data.title); }
  if (data.pass_number != null) { fields.push("pass_number = ?"); params.push(data.pass_number); }
  if (data.position != null) { fields.push("position = ?"); params.push(data.position); }
  if (data.meta != null) { fields.push("meta = ?"); params.push(JSON.stringify(data.meta)); }
  if (fields.length === 0) return;
  params.push(id);
  await db.query(`UPDATE modules SET ${fields.join(", ")} WHERE id = ?`, params);
}
