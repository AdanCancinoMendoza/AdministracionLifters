// models/ordenModel.js
import db from "../config/db.js";

/**
 * Guarda (reemplaza) la orden de participación para una competencia.
 * ordenItems: [{ id_competidor, orden, tiempo_por_ejercicio }]
 */
export const saveOrdenItems = async (id_competencia, ordenItems) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Borrar orden previa de la competencia
    await conn.query(
      `DELETE FROM orden_participacion WHERE id_competencia = ?`,
      [id_competencia]
    );

    const sqlInsert = `
      INSERT INTO orden_participacion
        (id_competencia, id_competidor, orden, tiempo_por_ejercicio, estado, creado_en)
      VALUES (?, ?, ?, ?, 'pendiente', NOW())
    `;

    for (const item of ordenItems) {
      await conn.query(sqlInsert, [
        id_competencia,
        item.id_competidor,
        item.orden,
        item.tiempo_por_ejercicio ?? 60,
      ]);
    }

    await conn.query(
      `INSERT INTO orden_eventos
        (id_competencia, evento_type, detalle, creado_en)
       VALUES (?, 'order_update', ?, NOW())`,
      [id_competencia, JSON.stringify({ orden: ordenItems })]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/** Obtener orden actual por competencia */
export const getOrdenByCompetencia = async (id_competencia) => {
  const [rows] = await db.query(
    `SELECT * FROM orden_participacion
     WHERE id_competencia = ?
     ORDER BY orden ASC`,
    [id_competencia]
  );
  return rows;
};

/**
 * Guarda (upsert) pesos asignados
 * pesos: [{ id_competencia, id_competidor, id_ejercicio, intento, peso }]
 */
export const savePesosAsignados = async (pesos) => {
  if (!Array.isArray(pesos) || pesos.length === 0) return;

  const sql = `
    INSERT INTO pesos_asignados
      (id_competencia, id_competidor, id_ejercicio, intento, peso, estado_intento, creado_en)
    VALUES (?, ?, ?, ?, ?, 'programado', NOW())
    ON DUPLICATE KEY UPDATE
      peso = VALUES(peso),
      estado_intento = VALUES(estado_intento),
      creado_en = NOW()
  `;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const p of pesos) {
      await conn.query(sql, [
        p.id_competencia,
        p.id_competidor,
        p.id_ejercicio,
        p.intento,
        p.peso,
      ]);
    }

    await conn.query(
      `INSERT INTO orden_eventos
        (id_competencia, evento_type, detalle, creado_en)
       VALUES (?, 'pesos_update', ?, NOW())`,
      [pesos[0].id_competencia, JSON.stringify({ count: pesos.length })]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// LOG eventos
export const insertOrdenEvento = async (
  id_competencia,
  id_competidor,
  id_ejercicio,
  evento_type,
  detalleObj = {}
) => {
  await db.query(
    `INSERT INTO orden_eventos
      (id_competencia, id_competidor, id_ejercicio, evento_type, detalle, creado_en)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      id_competencia,
      id_competidor || null,
      id_ejercicio || null,
      evento_type,
      JSON.stringify(detalleObj),
    ]
  );
};

// START participante
export const startParticipante = async (id_competencia, id_competidor) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE orden_participacion
       SET estado = 'en_cola'
       WHERE id_competencia = ? AND estado = 'en_curso'`,
      [id_competencia]
    );

    await conn.query(
      `UPDATE orden_participacion
       SET estado = 'en_curso', started_at = NOW(), paused_at = NULL
       WHERE id_competencia = ? AND id_competidor = ?`,
      [id_competencia, id_competidor]
    );

    await insertOrdenEvento(id_competencia, id_competidor, null, "start", {
      actor: "admin",
    });

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// PAUSE participante
export const pauseParticipante = async (id_competencia, id_competidor) => {
  await db.query(
    `UPDATE orden_participacion
     SET estado = 'pausado', paused_at = NOW()
     WHERE id_competencia = ? AND id_competidor = ?`,
    [id_competencia, id_competidor]
  );
  await insertOrdenEvento(id_competencia, id_competidor, null, "pause", {
    actor: "admin",
  });
};

// RESUME participante
export const resumeParticipante = async (id_competencia, id_competidor) => {
  await db.query(
    `UPDATE orden_participacion
     SET estado = 'en_curso', paused_at = NULL
     WHERE id_competencia = ? AND id_competidor = ?`,
    [id_competencia, id_competidor]
  );
  await insertOrdenEvento(id_competencia, id_competidor, null, "resume", {
    actor: "admin",
  });
};

// NEXT participante
export const nextParticipante = async (id_competencia, id_competidor) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE orden_participacion
       SET estado = 'finalizado', finished_at = NOW()
       WHERE id_competencia = ? AND id_competidor = ?`,
      [id_competencia, id_competidor]
    );

    const [[current]] = await conn.query(
      `SELECT orden FROM orden_participacion
       WHERE id_competencia = ? AND id_competidor = ?
       LIMIT 1`,
      [id_competencia, id_competidor]
    );

    let nextId = null;
    let nextOrden = null;

    if (current?.orden != null) {
      const [nextRows] = await conn.query(
        `SELECT id_competidor, orden FROM orden_participacion
         WHERE id_competencia = ? AND orden > ? AND estado != 'finalizado'
         ORDER BY orden ASC LIMIT 1`,
        [id_competencia, current.orden]
      );

      if (nextRows?.[0]) {
        nextId = nextRows[0].id_competidor;
        nextOrden = nextRows[0].orden;

        await conn.query(
          `UPDATE orden_participacion
           SET estado = 'en_curso', started_at = NOW()
           WHERE id_competencia = ? AND id_competidor = ?`,
          [id_competencia, nextId]
        );
      }
    }

    await insertOrdenEvento(id_competencia, id_competidor, null, "next", {
      nextId,
      nextOrden,
    });

    await conn.commit();
    return { nextId, nextOrden };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
export const getOrdenConPesosByCompetencia = async (id_competencia) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        op.id_competencia,
        op.id_competidor,
        c.nombre AS nombre_competidor,
        op.orden,
        pa.id_ejercicio,
        pa.intento,
        pa.peso,
        pa.estado_intento
      FROM orden_participacion op
      INNER JOIN competidores c
        ON op.id_competidor = c.id_competidor
      LEFT JOIN pesos_asignados pa
        ON pa.id_competidor = op.id_competidor
       AND pa.id_competencia = op.id_competencia
      WHERE op.id_competencia = ?
      ORDER BY op.orden ASC, pa.intento ASC;
      `,
      [id_competencia]
    );

    // Agrupar resultados por competidor
    const resultMap = {};
    for (const row of rows) {
      if (!resultMap[row.id_competidor]) {
        resultMap[row.id_competidor] = {
          competidor: {
            id_competidor: row.id_competidor,
            nombre: row.nombre_competidor,
            orden: row.orden,
          },
          pesos: [],
        };
      }

      if (row.id_ejercicio) {
        resultMap[row.id_competidor].pesos.push({
          id_ejercicio: row.id_ejercicio,
          intento: row.intento,
          peso: row.peso,
          estado_intento: row.estado_intento,
        });
      }
    }

    return Object.values(resultMap);
  } catch (err) {
    console.error("Error en getOrdenConPesosByCompetencia:", err);
    throw err;
  }
};
