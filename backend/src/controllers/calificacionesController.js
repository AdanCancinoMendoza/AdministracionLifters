// controllers/calificacionesController.js
import { recordVoteTransaction, getTallyForIntento } from "../models/calificacionesModel.js";

/** POST /api/competencias/:id/calificaciones */
export const registrarCalificacionController = async (req, res) => {
  try {
    const id_competencia = Number(req.params.id);
    if (!id_competencia) return res.status(400).json({ error: "id competencia requerido (params)" });

    // body: { id_competidor, id_ejercicio, intento, id_juez, valor:'Bueno'|'Malo', comentario? }
    let { id_competidor, id_ejercicio, intento, id_juez, valor, comentario } = req.body;

    // Si tienes auth, toma id_juez desde req.user (más seguro). Fallback al body:
    if (!id_juez && req.user?.id_juez) id_juez = req.user.id_juez;

    id_competidor = Number(id_competidor);
    id_ejercicio = Number(id_ejercicio);
    intento = Number(intento);
    id_juez = Number(id_juez);

    if (!id_competidor || !id_ejercicio || !intento || !id_juez || !valor) {
      return res.status(400).json({ error: "id_competidor, id_ejercicio, intento, id_juez y valor son requeridos" });
    }
    if (!["Bueno", "Malo"].includes(valor)) {
      return res.status(400).json({ error: "valor debe ser 'Bueno' o 'Malo'" });
    }
    if (!(intento >= 1 && intento <= 3)) {
      return res.status(400).json({ error: "intento debe ser 1, 2 o 3" });
    }

    const io = req.app.get("io");

    const result = await recordVoteTransaction({
      id_competencia,
      id_competidor,
      id_ejercicio,
      intento,
      id_juez,
      valor,
      comentario
    });

    // Emitir evento en tiempo real al room de la competencia
    if (io) {
      const payload = {
        id_competencia,
        id_competidor,
        id_ejercicio,
        intento,
        tally: result.tally,
        resultadoFinal: result.resultadoFinal,
        total_jueces: result.total_jueces,
        quorum: result.quorum,
        actuated_by: id_juez,
        timestamp: new Date().toISOString()
      };
      io.to(`competencia:${id_competencia}`).emit("vote_update", payload);
    }

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Error registrarCalificacionController:", err);
    if (err && err.code && err.message) {
      const status = Number(err.code) === 400 ? 400 : 500;
      return res.status(status).json({ error: err.message || "error" });
    }
    return res.status(500).json({ error: "Error al registrar calificación" });
  }
};

/** GET tally */
export const obtenerTallyController = async (req, res) => {
  try {
    const id_competencia = Number(req.params.id);
    const id_competidor = Number(req.params.id_competidor);
    const id_ejercicio = Number(req.params.id_ejercicio);
    const intento = Number(req.params.intento);
    if (!id_competencia || !id_competidor || !id_ejercicio || !intento) {
      return res.status(400).json({ error: "params inválidos" });
    }
    const tally = await getTallyForIntento(id_competencia, id_competidor, id_ejercicio, intento);
    return res.json({ ok: true, tally });
  } catch (err) {
    console.error("Error obtenerTallyController:", err);
    return res.status(500).json({ error: "Error al obtener tally" });
  }
};
