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

    // si existe y ya fue calificado -> NO bloqueamos, permitimos revotación/multijuez
    // if (attempt && attempt.approved !== null) {
    //   return res.status(409).json({ error: "attempt_already_judged", attempt });
    // }

    // si no existe, crear el intento (sin approved)
    let attemptId;
    if (!attempt) {
      attemptId = await Attempts.createAttempt(Number(id_competencia), Number(id_competidor), Number(exercise_id), Number(attempt_number), null, null);
      // fetch fresh
      attempt = await Attempts.getAttemptById(attemptId);
    } else {
      attemptId = attempt.id;
    }

    // Parse existing notes
    let currentNotes = [];
    try {
      if (attempt && attempt.notes) {
        const parsed = JSON.parse(attempt.notes);
        if (Array.isArray(parsed)) currentNotes = parsed;
      }
    } catch (e) { currentNotes = []; }

    // Append new vote
    const noteObj = { judge_id: Number(judge_id), valor, ts: Date.now() };
    currentNotes.push(noteObj);

    // Calculate tally
    const buenos = currentNotes.filter(n => n.valor === "Bueno").length;
    const malos = currentNotes.filter(n => n.valor === "Malo").length;

    // Rule: Bueno >= Malo -> Approved (1), else Rejected (0)
    const finalApproved = (buenos >= malos);

    // Update DB directly (approved, notes, judge_id)
    // Note: judge_id in attempts table usually stores the LAST judge, or null. We can keep updating it.
    await Attempts.setAttemptApproval(attemptId, finalApproved, Number(judge_id));

    // We also need to save the notes. setAttemptApproval doesn't do it.
    // We can use appendAttemptNote but we already have the full array, so let's just update the column.
    // However, appendAttemptNote fetches again. Let's just use a direct update or reuse appendAttemptNote logic but we need to set the APPROVED status too.
    // Let's use a direct query to be safe and atomic-ish.

    // Actually, let's use the model functions if possible, but setAttemptApproval only updates approved/judge_id.
    // appendAttemptNote updates notes.
    // So we can call both, or do a custom query here.
    // Custom query is safer to ensure we write exactly what we calculated.

    // Re-import db if needed? It's not imported in this file.
    // Ah, this file imports * as Attempts.
    // I should check if I can import db here.
    // Or I can just call appendAttemptNote (which adds the note) AND setAttemptApproval (which sets the status).
    // But appendAttemptNote reads the DB again.
    // Let's just call them in sequence. It's fine.
    // 1. Update status
    await Attempts.setAttemptApproval(attemptId, finalApproved, Number(judge_id));
    // 2. Append note (this will re-read and append, so we should NOT have added it to currentNotes manually if we use appendAttemptNote).
    // Wait, if I use appendAttemptNote, it reads existing notes and appends.
    // So I should NOT pass the manually constructed array.
    // BUT I need the array to calculate the status!

    // Correct flow:
    // 1. Append note using model (this saves it).
    const updatedAttemptWithNote = await Attempts.appendAttemptNote(attemptId, noteObj);

    // 2. Recalculate status based on updated notes.
    let newNotes = [];
    try {
      if (updatedAttemptWithNote.notes) {
        newNotes = JSON.parse(updatedAttemptWithNote.notes);
      }
    } catch (e) { }

    const b = newNotes.filter(n => n.valor === "Bueno").length;
    const m = newNotes.filter(n => n.valor === "Malo").length;
    const isApp = (b >= m);

    // 3. Update status
    await Attempts.setAttemptApproval(attemptId, isApp, Number(judge_id));

    // 4. Fetch final to return
    const updatedAttempt = await Attempts.getAttemptById(attemptId);

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
