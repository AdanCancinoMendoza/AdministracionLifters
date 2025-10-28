// models/calificacionesModel.js
import db from "../config/db.js";

export const recordVoteTransaction = async ({
  id_competencia,
  id_competidor,
  id_ejercicio,
  intento,
  id_juez,
  valor,
  comentario = null,
  quorumRule = null
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 0) valida que participante exista y esté en 'en_curso'
    const [opRows] = await conn.query(
      `SELECT estado, tiempo_por_ejercicio, started_at
       FROM orden_participacion
       WHERE id_competencia = ? AND id_competidor = ?
       LIMIT 1`,
      [id_competencia, id_competidor]
    );
    if (!opRows?.[0]) {
      throw { code: 400, message: "Orden/competidor no encontrado para la competencia" };
    }
    const op = opRows[0];
    if (op.estado !== "en_curso") {
      throw { code: 400, message: "No se permite calificar: participante no está en estado en_curso" };
    }

    // 1) Insert / update voto (ON DUPLICATE KEY UPDATE)
    const sqlUpsert = `
      INSERT INTO calificaciones_intento
        (id_competencia, id_competidor, id_ejercicio, intento, id_juez, valor, comentario, creado_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        valor = VALUES(valor),
        comentario = VALUES(comentario),
        creado_en = NOW()
    `;
    await conn.query(sqlUpsert, [
      id_competencia, id_competidor, id_ejercicio, intento, id_juez, valor, comentario
    ]);

    // 2) Obtener tally actual para ese intento
    const [tallyRows] = await conn.query(
      `SELECT valor, COUNT(*) as cnt
       FROM calificaciones_intento
       WHERE id_competencia = ? AND id_competidor = ? AND id_ejercicio = ? AND intento = ?
       GROUP BY valor`,
      [id_competencia, id_competidor, id_ejercicio, intento]
    );
    const tally = { Bueno: 0, Malo: 0 };
    (tallyRows || []).forEach(r => { tally[r.valor] = Number(r.cnt); });

    // 3) Obtener total de jueces para la competencia
    const [juecesRows] = await conn.query(
      `SELECT COUNT(*) as total_jueces FROM juecescompetencia WHERE id_competencia = ?`,
      [id_competencia]
    );
    const total_jueces = (juecesRows?.[0]?.total_jueces) ? Number(juecesRows[0].total_jueces) : 3;
    const quorum = quorumRule || Math.ceil(total_jueces / 2);

    // 4) Determinar resultado final si se alcanza quórum
    let resultadoFinal = null;
    if (tally.Bueno >= quorum) resultadoFinal = "Bueno";
    else if (tally.Malo >= quorum) resultadoFinal = "Malo";

    // 5) Si hay resultadoFinal, actualizar pesos_asignados.estado_intento
    if (resultadoFinal) {
      const nuevoEstado = (resultadoFinal === "Bueno") ? "realizado" : "invalidado";
      await conn.query(
        `UPDATE pesos_asignados
         SET estado_intento = ?
         WHERE id_competencia = ? AND id_competidor = ? AND id_ejercicio = ? AND intento = ?`,
        [nuevoEstado, id_competencia, id_competidor, id_ejercicio, intento]
      );
    }

    // 6) Insert evento en orden_eventos para auditoría
    const detalle = { intento, tally, resultadoFinal, actor: id_juez };
    await conn.query(
      `INSERT INTO orden_eventos
        (id_competencia, id_competidor, id_ejercicio, evento_type, detalle, creado_en)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id_competencia, id_competidor, id_ejercicio, "calificacion", JSON.stringify(detalle)]
    );

    await conn.commit();

    return { tally, resultadoFinal, total_jueces, quorum };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getTallyForIntento = async (id_competencia, id_competidor, id_ejercicio, intento) => {
  const [rows] = await db.query(
    `SELECT valor, COUNT(*) as cnt
     FROM calificaciones_intento
     WHERE id_competencia = ? AND id_competidor = ? AND id_ejercicio = ? AND intento = ?
     GROUP BY valor`,
    [id_competencia, id_competidor, id_ejercicio, intento]
  );
  const tally = { Bueno: 0, Malo: 0 };
  (rows || []).forEach(r => { tally[r.valor] = Number(r.cnt); });
  return tally;
};
