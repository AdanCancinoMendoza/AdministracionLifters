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

/* DELETE /api/modules/:id/assign/:competitorId */
export async function removeAssignmentHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const competitorId = Number(req.params.competitorId);
    if (!module_id || !competitorId) return res.status(400).json({ error: "module id y competitorId requeridos" });
    await ModuleAssignments.removeAssignment(module_id, competitorId);
    // emitir evento si hace falta
    const io = req.app.get("io");
    if (io) io.to(`competencia:${req.query.id_competencia ?? ""}`).emit("assignment_removed", { module_id, competitorId });
    res.json({ ok: true });
  } catch (err) {
    console.error("removeAssignmentHandler error", err);
    res.status(500).json({ error: err.message });
  }
}

/* DELETE /api/modules/:id  -> borrar módulo (y assignments / runs asociados) */
export async function deleteModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    if (!module_id) return res.status(400).json({ error: "module id requerido" });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // borrar assignments
      await conn.query("DELETE FROM module_assignments WHERE module_id = ?", [module_id]);
      // borrar runs
      await conn.query("DELETE FROM module_runs WHERE module_id = ?", [module_id]);
      // borrar módulo
      await conn.query("DELETE FROM modules WHERE id = ?", [module_id]);
      await conn.commit();

      const io = req.app.get("io");
      if (io) io.emit("module_deleted", { module_id });
      res.json({ ok: true });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("deleteModuleHandler error", err);
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

/* -------------------------------------------------
   START MODULE (única implementación)
   - crea module_runs y emite eventos (module_started y start)
   - recibe opcionalmente: started_by, state, id_competidor, id_competencia, id_ejercicio
--------------------------------------------------*/
export async function startModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { started_by, state, id_competidor, id_competencia, id_ejercicio } = req.body;
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

      // Emit socket events
      const io = req.app.get("io");
      if (io) {
        // Emisión genérica (compatibilidad)
        io.to(`competencia:${id_competencia ?? ""}`).emit("module_started", { module_id, runId });

        // Emisión que esperan los jueces: 'start'
        io.to(`competencia:${id_competencia ?? ""}`).emit("start", {
          id_competencia: id_competencia ?? null,
          id_competidor: id_competidor ?? null,
          id_ejercicio: id_ejercicio ?? null,
          runId,
          remaining: 60 // valor por defecto; el frontend puede ignorarlo o sobreescribirlo
        });
      }

      res.status(201).json({ runId });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("startModuleHandler error", err);
    res.status(500).json({ error: err.message });
  }
}


export async function selectParticipantHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competencia, id_competidor, id_ejercicio, started_by } = req.body;
    if (!module_id || !id_competencia || !id_competidor) {
      return res.status(400).json({ error: "module id, id_competencia e id_competidor requeridos" });
    }

    // Opcional: podrías validar que el competidor pertenece al módulo usando moduleAssignmentsModel

    const io = req.app.get("io");
    if (io) {
      io.to(`competencia:${id_competencia}`).emit("competitor:selected", {
        module_id,
        id_competencia: Number(id_competencia),
        id_competidor: Number(id_competidor),
        id_ejercicio: id_ejercicio ?? null,
        started_by: started_by ?? null,
        source: "server",
        timestamp: Date.now(),
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("selectParticipantHandler error", err);
    res.status(500).json({ error: err.message });
  }
}


// backend/src/controllers/modulesController.js (añadir al final)

export async function selectCompetitorHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competidor, id_competencia, id_ejercicio, source, timestamp, selected_by } = req.body;
    if (!module_id || !id_competidor) return res.status(400).json({ error: "module id e id_competidor requeridos" });

    // Opcional: registrar selección en module_runs/state si quieres persistir.
    // Por ahora solo emitimos el evento para que jueces reciban la selección inmediatamente.
    const io = req.app.get("io");
    if (io) {
      io.to(`competencia:${id_competencia ?? ""}`).emit("competitor:selected", {
        module_id,
        id_competencia: id_competencia ?? null,
        id_competidor: Number(id_competidor),
        id_ejercicio: id_ejercicio ?? null,
        source: source ?? "admin_ui",
        timestamp: timestamp ?? Date.now(),
        selected_by: selected_by ?? null,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("selectCompetitorHandler error", err);
    res.status(500).json({ error: err.message });
  }
}

/* -------------------------
   NUEVOS HANDLERS: resume/pause/reset/stop/end
   Estos endpoints tratan de mantener compatibilidad con el frontend:
   - Emiten los eventos de socket que el cliente espera: 'resume','pause','next'...
   - Guardan un pequeño rastro en module_runs (state JSON) y actualizan status en modules
---------------------------*/

function safeRoom(id_competencia) {
  return `competencia:${id_competencia ?? ""}`;
}

export async function resumeModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competencia, id_competidor, id_ejercicio, remaining, source } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query("INSERT INTO module_runs (module_id, started_by, state) VALUES (?, ?, ?)", [module_id, null, JSON.stringify({ action: 'resume', payload: req.body })]);
      await conn.query("UPDATE modules SET status = ? WHERE id = ?", ['running', module_id]);
      await conn.commit();
      const runId = r.insertId;

      const io = req.app.get("io");
      if (io) {
        io.to(safeRoom(id_competencia)).emit("resume", {
          id_competencia: id_competencia ?? null,
          id_competidor: id_competidor ?? null,
          id_ejercicio: id_ejercicio ?? null,
          remaining: typeof remaining === 'number' ? remaining : 60,
          runId,
          source: source ?? 'server'
        });
      }

      res.json({ ok: true, runId });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("resumeModuleHandler error", err);
    res.status(500).json({ error: err.message });
  }
}

export async function pauseModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competencia, id_competidor, id_ejercicio, remaining, source } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query("INSERT INTO module_runs (module_id, started_by, state) VALUES (?, ?, ?)", [module_id, null, JSON.stringify({ action: 'pause', payload: req.body })]);
      await conn.query("UPDATE modules SET status = ? WHERE id = ?", ['paused', module_id]);
      await conn.commit();
      const runId = r.insertId;

      const io = req.app.get("io");
      if (io) {
        io.to(safeRoom(id_competencia)).emit("pause", {
          id_competencia: id_competencia ?? null,
          id_competidor: id_competidor ?? null,
          id_ejercicio: id_ejercicio ?? null,
          remaining: typeof remaining === 'number' ? remaining : 0,
          runId,
          source: source ?? 'server'
        });
      }

      res.json({ ok: true, runId });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("pauseModuleHandler error", err);
    res.status(500).json({ error: err.message });
  }
}

export async function resetModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competencia, id_competidor, id_ejercicio, remaining, source } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query("INSERT INTO module_runs (module_id, started_by, state) VALUES (?, ?, ?)", [module_id, null, JSON.stringify({ action: 'reset', payload: req.body })]);
      await conn.query("UPDATE modules SET status = ? WHERE id = ?", ['paused', module_id]);
      await conn.commit();
      const runId = r.insertId;

      const io = req.app.get("io");
      if (io) {
        // Emitimos tanto 'reset' (para quien lo soporte) como 'pause' para compatibilidad
        io.to(safeRoom(id_competencia)).emit("reset", {
          id_competencia: id_competencia ?? null,
          id_competidor: id_competidor ?? null,
          id_ejercicio: id_ejercicio ?? null,
          remaining: typeof remaining === 'number' ? remaining : null,
          runId,
          source: source ?? 'server'
        });
        io.to(safeRoom(id_competencia)).emit("pause", {
          id_competencia: id_competencia ?? null,
          id_competidor: id_competidor ?? null,
          id_ejercicio: id_ejercicio ?? null,
          remaining: typeof remaining === 'number' ? remaining : 0,
          runId,
          source: source ?? 'server'
        });
      }

      res.json({ ok: true, runId });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("resetModuleHandler error", err);
    res.status(500).json({ error: err.message });
  }
}

export async function stopModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competencia, id_competidor, id_ejercicio, remaining, source } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query("INSERT INTO module_runs (module_id, started_by, state) VALUES (?, ?, ?)", [module_id, null, JSON.stringify({ action: 'stop', payload: req.body })]);
      await conn.query("UPDATE modules SET status = ? WHERE id = ?", ['stopped', module_id]);
      await conn.commit();
      const runId = r.insertId;

      const io = req.app.get("io");
      if (io) {
        // Emitimos 'stop' y también 'pause' para compat
        io.to(safeRoom(id_competencia)).emit("stop", {
          id_competencia: id_competencia ?? null,
          id_competidor: id_competidor ?? null,
          id_ejercicio: id_ejercicio ?? null,
          remaining: typeof remaining === 'number' ? remaining : 0,
          runId,
          source: source ?? 'server'
        });
        io.to(safeRoom(id_competencia)).emit("pause", {
          id_competencia: id_competencia ?? null,
          id_competidor: id_competidor ?? null,
          id_ejercicio: id_ejercicio ?? null,
          remaining: typeof remaining === 'number' ? remaining : 0,
          runId,
          source: source ?? 'server'
        });
      }

      res.json({ ok: true, runId });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("stopModuleHandler error", err);
    res.status(500).json({ error: err.message });
  }
}

export async function endModuleHandler(req, res) {
  try {
    const module_id = Number(req.params.id);
    const { id_competencia, id_competidor, id_ejercicio, source } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query("INSERT INTO module_runs (module_id, started_by, state) VALUES (?, ?, ?)", [module_id, null, JSON.stringify({ action: 'end', payload: req.body })]);
      await conn.query("UPDATE modules SET status = ? WHERE id = ?", ['ended', module_id]);
      await conn.commit();
      const runId = r.insertId;

      const io = req.app.get("io");
      if (io) {
        // Emitimos evento que frontend interpreta como "terminó este bloque" -> `next` con nextId null
        io.to(safeRoom(id_competencia)).emit("module_ended", { module_id, runId });
        io.to(safeRoom(id_competencia)).emit("next", { id_competencia: id_competencia ?? null, nextId: null, id_ejercicio: id_ejercicio ?? null, remaining: 0, source: source ?? 'server' });
      }

      res.json({ ok: true, runId });
    } catch (err2) {
      await conn.rollback();
      throw err2;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("endModuleHandler error", err);
    res.status(500).json({ error: err.message });
  }
}

// ------------------------------------------------------------------
// backend/src/controllers/attemptsController.js (sin cambios necesarios)
// ------------------------------------------------------------------

// El archivo attemptsController.js se mantiene tal y como lo compartiste. Si quieres que haga cambios
// concretos en attemptsController (por ejemplo emitir eventos adicionales o cambiar la ruta /attempts/reset),
// dímelo y los aplico.
