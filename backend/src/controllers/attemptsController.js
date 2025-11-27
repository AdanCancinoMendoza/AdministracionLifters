// backend/src/controllers/attemptsController.js
import * as Attempts from "../models/attemptsModel.js";

/**
 * POST /api/attempts/reset
 * body: { id_competencia }
 */
export async function resetAttemptsHandler(req, res) {
  try {
    const { id_competencia } = req.body;
    if (!id_competencia) return res.status(400).json({ error: "id_competencia requerido" });

    await Attempts.resetAttemptsForCompetition(Number(id_competencia));

    // emitir evento por room de la competencia (si existe io)
    const io = req.app.get("io");
    if (io) io.to(`competencia:${id_competencia}`).emit("attempts_reset", { id_competencia });

    res.json({ ok: true });
  } catch (err) {
    console.error("resetAttemptsHandler error", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}

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

    await Attempts.upsertAttemptWeight(
      Number(id_competencia),
      Number(id_competidor),
      Number(exercise_id),
      Number(attempt_number),
      weight_kg == null ? null : Number(weight_kg),
      module_id == null ? null : Number(module_id)
    );

    // emitir evento para que front actualice
    const io = req.app.get("io");
    if (io) {
      io.to(`competencia:${id_competencia}`).emit("attempt_upsert", {
        id_competencia: Number(id_competencia),
        id_competidor: Number(id_competidor),
        exercise_id: Number(exercise_id),
        attempt_number: Number(attempt_number),
        weight_kg: weight_kg == null ? null : Number(weight_kg),
        module_id: module_id == null ? null : Number(module_id),
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("upsertWeightHandler error", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}

/**
 * POST /api/attempts/create
 * body: { id_competencia, id_competidor, exercise_id, attempt_number, weight_kg?, module_id? }
 */
export async function createAttemptHandler(req, res) {
  try {
    const { id_competencia, id_competidor, exercise_id, attempt_number, weight_kg, module_id } = req.body;
    if (!id_competencia || !id_competidor || !exercise_id || !attempt_number) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    const id = await Attempts.createAttempt(
      Number(id_competencia),
      Number(id_competidor),
      Number(exercise_id),
      Number(attempt_number),
      weight_kg == null ? null : Number(weight_kg),
      module_id == null ? null : Number(module_id)
    );

    // emitir evento creation por room
    const io = req.app.get("io");
    if (io) io.to(`competencia:${id_competencia}`).emit("attempt_created", {
      id,
      id_competencia: Number(id_competencia),
      id_competidor: Number(id_competidor),
      exercise_id: Number(exercise_id),
      attempt_number: Number(attempt_number),
      weight_kg: weight_kg == null ? null : Number(weight_kg),
      module_id: module_id == null ? null : Number(module_id),
    });

    res.status(201).json({ id });
  } catch (err) {
    console.error("createAttemptHandler error", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}

/**
 * PATCH /api/attempts/:id/approve
 * body: { approved: boolean|null, judge_id?, force? }
 *
 * Nuevo comportamiento:
 *  - Si quien solicita es un juez (judge_id != null) y intento ya calificado y no viene force -> 409 (bloqueo original)
 *  - Si quien solicita es admin (judge_id == null) permitimos sobrescribir
 *  - Si viene force === true permitimos sobrescribir
 */
export async function approveAttemptHandler(req, res) {
  try {
    const attemptId = Number(req.params.id);
    const { approved, judge_id, force } = req.body;

    if (!attemptId) {
      return res.status(400).json({ error: "attempt id inválido" });
    }

    // validated approved: allow true | false | null
    const isApprovedValid = approved === null || typeof approved === "boolean";
    if (!isApprovedValid) {
      return res.status(400).json({ error: "approved debe ser boolean o null" });
    }

    // buscar intento
    const attempt = await Attempts.getAttemptById(attemptId);
    if (!attempt) return res.status(404).json({ error: "attempt_not_found" });

    /**
     * Nuevo comportamiento:
     * - Si el intento ya fue calificado (attempt.approved !== null) y quien intenta calificar
     *   es un juez (judge_id != null) y no se pasó force=true -> bloquear (409).
     * - Si judge_id == null (admin panel) permitimos sobrescribir sin force.
     * - Si se pasa force === true, permitimos sobrescribir incluso si judge_id != null.
     */
    const isAlreadyJudged = attempt.approved !== null;
    const isJudgeAction = judge_id != null;
    const forced = force === true || force === "true";

    if (isAlreadyJudged && isJudgeAction && !forced) {
      // bloqueo solo para casos donde un juez intenta re-calificar sin force
      return res.status(409).json({ error: "attempt_already_judged", current: attempt });
    }

    // setear approved e id de juez (puede ser null para admin)
    await Attempts.setAttemptApproval(attemptId, approved == null ? null : Boolean(approved), judge_id == null ? null : Number(judge_id));

    // agregar nota (registro del voto) si se proporcionó judge_id y approved no es null
    if (judge_id != null && approved != null) {
      const noteObj = { judge_id: Number(judge_id), valor: approved ? "Bueno" : "Malo", ts: Date.now() };
      if (typeof Attempts.appendAttemptNote === "function") {
        await Attempts.appendAttemptNote(attemptId, noteObj);
      } else {
        console.warn("appendAttemptNote no está implementada en attemptsModel. No se guardará nota de juez.");
      }
    }

    // emitir evento socket (por room si la row contiene id_competencia)
    const io = req.app.get("io");
    try {
      let payload = { attemptId, approved: approved == null ? null : Boolean(approved), judge_id: judge_id == null ? null : Number(judge_id), forced: forced };

      if (io && attempt && attempt.id_competencia) {
        io.to(`competencia:${attempt.id_competencia}`).emit("attempt_approved", {
          ...payload,
          attempt,
        });
      } else if (io) {
        io.emit("attempt_approved", payload);
      }
    } catch (emitErr) {
      console.warn("Error al emitir evento socket en approveAttemptHandler:", emitErr);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("approveAttemptHandler error", err);
    res.status(500).json({ error: err.message || String(err) });
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
    console.error("getAttemptsByCompetitorHandler error", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
