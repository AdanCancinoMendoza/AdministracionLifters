// backend/src/controllers/attemptsController.js
import * as Attempts from "../models/attemptsModel.js";
import db from "../config/db.js";

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
 * POST /api/attempts/competencias/:id/calificaciones
 * body: { id_competidor, exercise_id, attempt_number, judge_id, valor, force? }
 *
 * Operación atómica: asegura que exista el attempt (find-or-create) y aplica la aprobación (approve)
 * en la misma transacción. Devuelve el attempt final.
 */
export async function upsertAndApproveHandler(req, res) {
  const id_competencia = Number(req.params.id);
  const { id_competidor, exercise_id, attempt_number, judge_id, valor, force } = req.body;
  if (!id_competencia || !id_competidor || !exercise_id || !attempt_number) {
    return res.status(400).json({ error: "faltan parametros" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Insertar si no existe (requiere UNIQUE index sobre id_competencia,id_competidor,exercise_id,attempt_number)
    const insertSql = `
      INSERT INTO attempts (id_competencia, id_competidor, exercise_id, attempt_number)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
    `;
    const [ins] = await conn.query(insertSql, [id_competencia, id_competidor, exercise_id, attempt_number]);

    let attemptId = ins.insertId;
    if (!attemptId) {
      const [rows] = await conn.query(
        `SELECT id FROM attempts WHERE id_competencia=? AND id_competidor=? AND exercise_id=? AND attempt_number=? LIMIT 1`,
        [id_competencia, id_competidor, exercise_id, attempt_number]
      );
      attemptId = rows[0] && rows[0].id;
    }

    if (!attemptId) throw new Error("No se pudo crear/buscar intento");

    // 2) Leer intento actual
    const [existingRows] = await conn.query(`SELECT * FROM attempts WHERE id = ? LIMIT 1`, [attemptId]);
    const existing = existingRows[0] ?? null;

    const isAlreadyJudged = existing && existing.approved !== null;
    const isJudgeAction = judge_id != null;
    const forced = force === true || force === "true";

    // if (isAlreadyJudged && isJudgeAction && !forced) {
    //   await conn.commit();
    //   return res.status(409).json({ error: "attempt_already_judged", current: existing });
    // }

    // 3) Actualizar approved y judge_id si se proporcionó valor
    // 3) Actualizar approved y judge_id si se proporcionó valor
    if (valor !== undefined && valor !== null) {
      // Parse existing notes
      let currentNotes = [];
      try {
        if (existing && existing.notes) {
          const parsed = JSON.parse(existing.notes);
          if (Array.isArray(parsed)) currentNotes = parsed;
        }
      } catch (e) { currentNotes = []; }

      // Append new vote
      currentNotes.push({ judge_id: Number(judge_id), valor: valor === "Bueno" ? "Bueno" : "Malo", ts: Date.now() });

      // Calculate tally
      const buenos = currentNotes.filter(n => n.valor === "Bueno").length;
      const malos = currentNotes.filter(n => n.valor === "Malo").length;

      // Rule: Bueno >= Malo -> Approved (1), else Rejected (0)
      // (User specified: 1B+1M=B, 1B+2M=M, 0B+2M=M. This implies Tie=Bueno)
      const finalApproved = (buenos >= malos) ? 1 : 0;

      await conn.query(
        `UPDATE attempts SET approved = ?, notes = ?, judge_id = ? WHERE id = ?`,
        [finalApproved, JSON.stringify(currentNotes), judge_id ?? null, attemptId]
      );
    }

    // 4) Leer intento final y commit
    const [finalRows] = await conn.query(`SELECT * FROM attempts WHERE id = ? LIMIT 1`, [attemptId]);
    const attempt = finalRows[0] ?? null;

    await conn.commit();

    // Emitir evento socket con attempt completo
    const io = req.app.get("io");
    if (io && attempt && attempt.id_competencia) {
      io.to(`competencia:${attempt.id_competencia}`).emit("attempt_approved", { attempt });
    }

    return res.json({ ok: true, attempt });
  } catch (err) {
    try { await conn.rollback(); } catch (e) { /* ignore */ }
    console.error("upsertAndApproveHandler error", err);
    return res.status(500).json({ error: err.message || String(err) });
  } finally {
    conn.release();
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

    const isAlreadyJudged = attempt.approved !== null;
    const isJudgeAction = judge_id != null;
    const forced = force === true || force === "true";

    // if (isAlreadyJudged && isJudgeAction && !forced) {
    //   return res.status(409).json({ error: "attempt_already_judged", current: attempt });
    // }

    // 3) Logic for majority voting
    if (judge_id != null && approved != null) {
      // Parse existing notes
      let currentNotes = [];
      try {
        if (attempt.notes) {
          const parsed = JSON.parse(attempt.notes);
          if (Array.isArray(parsed)) currentNotes = parsed;
        }
      } catch (e) { currentNotes = []; }

      // Append new vote
      currentNotes.push({ judge_id: Number(judge_id), valor: approved ? "Bueno" : "Malo", ts: Date.now() });

      // Calculate tally
      const buenos = currentNotes.filter(n => n.valor === "Bueno").length;
      const malos = currentNotes.filter(n => n.valor === "Malo").length;

      // Rule: Bueno >= Malo -> Approved (1), else Rejected (0)
      const finalApproved = (buenos >= malos) ? 1 : 0;

      // Update DB directly
      await db.query(
        "UPDATE attempts SET approved = ?, notes = ?, judge_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [finalApproved, JSON.stringify(currentNotes), Number(judge_id), attemptId]
      );
    } else {
      // Admin override or simple update without judge logic
      await Attempts.setAttemptApproval(attemptId, approved == null ? null : Boolean(approved), judge_id == null ? null : Number(judge_id));
    }

    // leer intento actualizado
    const updated = await Attempts.getAttemptById(attemptId);

    // emitir evento socket (por room si la row contiene id_competencia)
    const io = req.app.get("io");
    try {
      let payload = { attemptId, approved: approved == null ? null : Boolean(approved), judge_id: judge_id == null ? null : Number(judge_id), forced: forced };

      if (io && updated && updated.id_competencia) {
        io.to(`competencia:${updated.id_competencia}`).emit("attempt_approved", {
          ...payload,
          attempt: updated,
        });
      } else if (io) {
        io.emit("attempt_approved", { ...payload, attempt: updated });
      }
    } catch (emitErr) {
      console.warn("Error al emitir evento socket en approveAttemptHandler:", emitErr);
    }

    res.json({ ok: true, attempt: updated });
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
