import db from "../config/db.js";
// backend/src/models/moduleRunsModel.js

export async function createModuleRun(module_id, started_by = null, state = null) {
  const [res] = await db.query("INSERT INTO module_runs (module_id, started_by, state) VALUES (?, ?, ?)", [
    module_id,
    started_by,
    state ? JSON.stringify(state) : null
  ]);
  return res.insertId;
}

export async function finishModuleRun(id) {
  await db.query("UPDATE module_runs SET finished_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
}

export async function getLastRunForModule(module_id) {
  const [rows] = await db.query("SELECT * FROM module_runs WHERE module_id = ? ORDER BY started_at DESC LIMIT 1", [module_id]);
  return rows[0] ?? null;
}
