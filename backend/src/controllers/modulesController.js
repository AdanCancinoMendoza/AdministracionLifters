// backend/src/controllers/modulesController.js
import * as Modules from "../models/modulesModel.js";
import * as ModuleAssignments from "../models/moduleAssignmentsModel.js";
import * as ModuleRuns from "../models/moduleRunsModel.js";
import db from "../config/db.js";

/* POST /api/modules
   body: { id_competencia, title, pass_number?, position?, meta? }
*/
export async function createModuleHandler(req, res) {
  try {
    const { id_competencia, title, pass_number, position, meta } = req.body;
    if (!id_competencia || !title) return res.status(400).json({ error: "id_competencia y title son requeridos" });
    const id = await Modules.createModule(Number(id_competencia), String(title), Number(pass_number ?? 1), Number(position ?? 0), meta ?? null);
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/* GET /api/modules?competition_id=...
   Devuelve lista de módulos para la competencia
*/
export async function getModulesHandler(req, res) {
  try {
    // aceptar tanto competition_id como id_competencia por si el frontend usa diferentes nombres
    const id_competencia = Number(req.query.competition_id ?? req.query.id_competencia);
    if (!id_competencia) return res.status(400).json({ error: "id_competencia (competition_id) requerido" });
    const rows = await Modules.getModulesByCompetition(id_competencia);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/* POST /api/modules/:id/assign
   body: { id_competidor, position? }
*/
export async function assignCompetitorHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competidor, position } = req.body;
    if (!module_id || !id_competidor) return res.status(400).json({ error: "module id y id_competidor requeridos" });
    const insertId = await ModuleAssignments.assignCompetitorToModule(module_id, Number(id_competidor), position != null ? Number(position) : undefined);
    res.status(201).json({ id: insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/* GET /api/modules/:id/assignments */
export async function getAssignmentsHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const rows = await ModuleAssignments.getAssignmentsForModule(module_id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/* POST /api/modules/:id/start
   body: { started_by?, state? } -> creates module_run
*/
export async function startModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { started_by, state } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query("INSERT INTO module_runs (module_id, started_by, state) VALUES (?, ?, ?)", [
        module_id,
        started_by ?? null,
        state ? JSON.stringify(state) : null
      ]);
      await conn.commit();
      const runId = r.insertId;
      // Emit socket event
      const io = req.app.get("io");
      if (io) io.to(`competencia:${req.body.id_competencia ?? ""}`).emit("module_started", { module_id, runId });
      res.status(201).json({ runId });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/*
 GET /api/modules/:id/next?exercise_id=...
*/
export async function getNextParticipantHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const exercise_id = Number(req.query.exercise_id);
    if (!module_id || !exercise_id) return res.status(400).json({ error: "module_id y exercise_id requeridos" });

    const sql = `
      SELECT ma.id_competidor, COALESCE(a.attempts_cnt, 0) AS attempts_cnt, ma.position
      FROM module_assignments ma
      LEFT JOIN (
        SELECT id_competidor, COUNT(*) AS attempts_cnt
        FROM attempts
        WHERE module_id = ? AND exercise_id = ?
        GROUP BY id_competidor
      ) a ON a.id_competidor = ma.id_competidor
      WHERE ma.module_id = ? AND COALESCE(a.attempts_cnt,0) < 3
      ORDER BY ma.position
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [module_id, exercise_id, module_id]);
    const next = rows[0] ?? null;
    res.json({ next });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
