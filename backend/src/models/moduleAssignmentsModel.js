// backend/src/models/moduleAssignmentsModel.js
import db from "../config/db.js";

/**
 * Assign a competitor to a module. If position omitted, append at end.
 * Throws if duplicate (handled by DB unique key).
 */
export async function assignCompetitorToModule(module_id, id_competidor, position) {
  if (position == null) {
    const [[row]] = await db.query("SELECT MAX(position) AS maxpos FROM module_assignments WHERE module_id = ?", [module_id]);
    position = (row?.maxpos ?? -1) + 1;
  }
  try {
    const [res] = await db.query(
      "INSERT INTO module_assignments (module_id, id_competidor, position) VALUES (?, ?, ?)",
      [module_id, id_competidor, position]
    );
    return res.insertId;
  } catch (err) {
    // ER_DUP_ENTRY
    if (err && err.code === "ER_DUP_ENTRY") {
      throw new Error("Competidor ya asignado o posición en uso");
    }
    throw err;
  }
}

export async function removeAssignment(module_id, id_competidor) {
  await db.query("DELETE FROM module_assignments WHERE module_id = ? AND id_competidor = ?", [module_id, id_competidor]);
}

export async function getAssignmentsForModule(module_id) {
  const [rows] = await db.query(
    `SELECT ma.id, ma.module_id, ma.id_competidor, ma.position, c.nombre, c.apellidos, c.peso, c.categoria
     FROM module_assignments ma
     JOIN competidores c ON c.id_competidor = ma.id_competidor
     WHERE ma.module_id = ?
     ORDER BY ma.position ASC`,
    [module_id]
  );
  return rows;
}
