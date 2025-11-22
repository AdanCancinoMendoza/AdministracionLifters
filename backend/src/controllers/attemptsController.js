// backend/src/controllers/attemptsController.js
import * as Attempts from "../models/attemptsModel.js";

/**
 * POST /api/attempts/upsert-weight
 * body: { id_competencia, id_competidor, exercise_id, attempt_number, weight_kg, module_id? }
 */
export async function upsertWeightHandler(req, res) {
  try {
    const { id_competencia, id_competidor, exercise_id, attempt_number, weight_kg, module_id } = req.body;
    if (!id_competencia || !id_competidor || !exercise_id || !attempt_number) {
      return res.status(400).json({ error: "Faltan parámetros obligatorios" });
    }
    await Attempts.upsertAttemptWeight(Number(id_competencia), Number(id_competidor), Number(exercise_id), Number(attempt_number), weight_kg == null ? null : Number(weight_kg), module_id == null ? null : Number(module_id));
    // emitir evento
    const io = req.app.get("io");
    if (io) io.to(`competencia:${id_competencia}`).emit("attempt_upsert", {
      id_competencia,
      id_competidor,
      exercise_id,
      attempt_number,
      weight_kg,
      module_id: module_id ?? null
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/attempts/create
 */
export async function createAttemptHandler(req, res) {
  try {
    const { id_competencia, id_competidor, exercise_id, attempt_number, weight_kg, module_id } = req.body;
    if (!id_competencia || !id_competidor || !exercise_id || !attempt_number) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }
    const id = await Attempts.createAttempt(Number(id_competencia), Number(id_competidor), Number(exercise_id), Number(attempt_number), weight_kg == null ? null : Number(weight_kg), module_id == null ? null : Number(module_id));
    const io = req.app.get("io");
    if (io) io.to(`competencia:${id_competencia}`).emit("attempt_created", { id, id_competencia, id_competidor, exercise_id, attempt_number, weight_kg, module_id: module_id ?? null });
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/attempts/:id/approve
 * body: { approved: boolean|null, judge_id? }
 */
export async function approveAttemptHandler(req, res) {
  try {
    const attemptId = Number(req.params.id);
    const { approved, judge_id } = req.body;
    await Attempts.setAttemptApproval(attemptId, approved == null ? null : Boolean(approved), judge_id == null ? null : Number(judge_id));
    // Buscar el registro para saber id_competencia y emitir
    // (opcional: get attempt by id to fetch id_competencia; here we'll emit generic event)
    const io = req.app.get("io");
    if (io) io.emit("attempt_approved", { attemptId, approved, judge_id }); // puedes emitir por room si obtienes id_competencia
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/attempts/by-competitor?id_competencia=..&id_competidor=..
 */
export async function getAttemptsByCompetitorHandler(req, res) {
  try {
    const id_competencia = Number(req.query.id_competencia);
    const id_competidor = Number(req.query.id_competidor);
    if (!id_competencia || !id_competidor) return res.status(400).json({ error: "id_competencia e id_competidor requeridos" });
    const rows = await Attempts.getAttempts(id_competencia, id_competidor);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
