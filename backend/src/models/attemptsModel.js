// backend/src/models/attemptsModel.js
import db from "../config/db.js";

export async function getAttempts(id_competencia, id_competidor) {
  const [rows] = await db.query(
    "SELECT * FROM attempts WHERE id_competencia = ? AND id_competidor = ? ORDER BY exercise_id, attempt_number",
    [id_competencia, id_competidor]
  );
  return rows;
}


export async function resetAttemptsForCompetition(id_competencia) {
  // Elimina filas. Si prefieres UPDATE para mantener histórico, usa UPDATE.
  await db.query("DELETE FROM attempts WHERE id_competencia = ?", [id_competencia]);
}



export async function countAttemptsFor(id_competencia, id_competidor, exercise_id) {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM attempts WHERE id_competencia = ? AND id_competidor = ? AND exercise_id = ?",
    [id_competencia, id_competidor, exercise_id]
  );
  return Number(row?.cnt ?? 0);
}

export async function upsertAttemptWeight(id_competencia, id_competidor, exercise_id, attempt_number, weight_kg = null, module_id = null) {
  const sql =
    "INSERT INTO attempts (id_competencia, id_competidor, exercise_id, module_id, attempt_number, weight_kg, approved, created_at, updated_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
    "ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), module_id = VALUES(module_id), updated_at = CURRENT_TIMESTAMP";
  await db.query(sql, [id_competencia, id_competidor, exercise_id, module_id, attempt_number, weight_kg]);
}

export async function createAttempt(id_competencia, id_competidor, exercise_id, attempt_number, weight_kg = null, module_id = null) {
  const [res] = await db.query(
    "INSERT INTO attempts (id_competencia, id_competidor, exercise_id, module_id, attempt_number, weight_kg) VALUES (?, ?, ?, ?, ?, ?)",
    [id_competencia, id_competidor, exercise_id, module_id, attempt_number, weight_kg]
  );
  return res.insertId;
}

export async function setAttemptApproval(attemptId, approved, judgeId = null) {
  const ap = approved == null ? null : approved ? 1 : 0;
  await db.query("UPDATE attempts SET approved = ?, judge_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [ap, judgeId, attemptId]);
}

export async function getAttemptByUnique(id_competencia, id_competidor, exercise_id, attempt_number) {
  const [rows] = await db.query(
    "SELECT * FROM attempts WHERE id_competencia = ? AND id_competidor = ? AND exercise_id = ? AND attempt_number = ? LIMIT 1",
    [id_competencia, id_competidor, exercise_id, attempt_number]
  );
  return rows[0] ?? null;
}


export async function getAttemptById(id) {
  const [[row]] = await db.query("SELECT * FROM attempts WHERE id = ? LIMIT 1", [id]);
  return row ?? null;
}

/**
 * Append a note (JSON array) to the notes column and return the updated row.
 * noteObj should be a plain object, e.g. { judge_id: 4, valor: "Bueno", ts: 12345678 }
 */
export async function appendAttemptNote(attemptId, noteObj) {
  const attempt = await getAttemptById(attemptId);
  let notesArr = [];
  try {
    if (attempt?.notes) {
      const parsed = JSON.parse(attempt.notes);
      if (Array.isArray(parsed)) notesArr = parsed;
    }
  } catch (e) {
    notesArr = [];
  }
  notesArr.push(noteObj);
  await db.query("UPDATE attempts SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(notesArr), attemptId]);
  return await getAttemptById(attemptId);
}