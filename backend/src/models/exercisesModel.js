import db from "../config/db.js";

export async function getAllExercises() {
  const [rows] = await db.query("SELECT id, name, slug, position FROM exercises ORDER BY position ASC");
  return rows;
}
