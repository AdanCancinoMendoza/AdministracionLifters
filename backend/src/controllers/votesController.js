// backend/src/controllers/votesController.js
import * as Attempts from "../models/attemptsModel.js";

/**
 * POST /.../competencias/:id/calificaciones
 * Body expected:
 * { id_competidor, exercise_id, attempt_number, judge_id, valor } 
 * valor: "Bueno" | "Malo"
 */
export async function postVoteHandler(req, res) {
  try {
    const id_competencia = Number(req.params.id);
    const { id_competidor, exercise_id, attempt_number, judge_id, valor } = req.body || {};

    if (!id_competencia || !id_competidor || !exercise_id || !attempt_number || !judge_id || (valor !== "Bueno" && valor !== "Malo")) {
      return res.status(400).json({ error: "Faltan parámetros o son inválidos. Se requiere id_competencia (params), id_competidor, exercise_id, attempt_number, judge_id y valor ('Bueno'|'Malo')" });
    }

    // buscar intento por única combinación
    let attempt = await Attempts.getAttemptByUnique(id_competencia, id_competidor, exercise_id, attempt_number);

    // si existe y ya fue calificado -> bloqueado
    if (attempt && attempt.approved !== null) {
      return res.status(409).json({ error: "attempt_already_judged", attempt });
    }

    // si no existe, crear el intento (sin approved)
    let attemptId;
    if (!attempt) {
      attemptId = await Attempts.createAttempt(Number(id_competencia), Number(id_competidor), Number(exercise_id), Number(attempt_number), null, null);
    } else {
      attemptId = attempt.id;
    }

    // setear approved y judge_id
    const approved = valor === "Bueno" ? true : false;
    await Attempts.setAttemptApproval(attemptId, approved, Number(judge_id));

    // anexar nota
    const noteObj = { judge_id: Number(judge_id), valor, ts: Date.now() };
    const updatedAttempt = await Attempts.appendAttemptNote(attemptId, noteObj);

    // emitir evento al room de la competencia
    const io = req.app.get("io");
    if (io) {
      io.to(`competencia:${id_competencia}`).emit("vote_update", {
        id_competencia,
        id_competidor,
        exercise_id,
        attempt_number,
        attempt: updatedAttempt,
      });
    }

    return res.json({ ok: true, attempt: updatedAttempt });
  } catch (err) {
    console.error("postVoteHandler error", err);
    return res.status(500).json({ error: err.message });
  }
}
