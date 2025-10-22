import db from "../config/db.js";

// Crear un nuevo competidor
export const crearCompetidor = async (data) => {
  const sql = `
    INSERT INTO competidores
    (nombre, apellidos, peso, edad, categoria, telefono, correo, pagado, id_competencia, comprobante_pago)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    data.nombre,
    data.apellidos,
    data.peso,
    data.edad,
    data.categoria,
    data.telefono,
    data.correo,
    data.pagado,
    data.id_competencia,
    data.comprobante_pago || null,
  ]);
  return result.insertId;
};

//  Obtener todos los competidores + datos de la competencia
export const obtenerCompetidores = async () => {
  const [rows] = await db.query(`
    SELECT 
      c.id_competidor,
      c.nombre,
      c.apellidos,
      c.peso,
      c.edad,
      c.categoria,
      c.telefono,
      c.correo,
      c.pagado,
      c.id_competencia,
      c.fecha_inscripcion,
      c.comprobante_pago,
      comp.nombre AS nombre_competencia,
      comp.foto AS foto_competencia,
      comp.fecha_inicio,
      comp.fecha_cierre
    FROM competidores c
    LEFT JOIN competenciasadmin comp ON c.id_competencia = comp.id_competencia
    ORDER BY c.fecha_inscripcion DESC
  `);
  return rows;
};

// Obtener competidor por ID (con nombre de competencia)
export const obtenerCompetidorPorId = async (id) => {
  const [rows] = await db.query(`
    SELECT 
      c.id_competidor,
      c.nombre,
      c.apellidos,
      c.peso,
      c.edad,
      c.categoria,
      c.telefono,
      c.correo,
      c.pagado,
      c.id_competencia,
      c.fecha_inscripcion,
      c.comprobante_pago,
      comp.nombre AS nombre_competencia,
      comp.foto AS foto_competencia,
      comp.fecha_inicio,
      comp.fecha_cierre
    FROM competidores c
    LEFT JOIN competenciasadmin comp ON c.id_competencia = comp.id_competencia
    WHERE c.id_competidor = ?
  `, [id]);
  return rows[0];
};

// Actualizar competidor
export const actualizarCompetidor = async (id, data) => {
  const sql = `
    UPDATE competidores
    SET nombre = ?, apellidos = ?, peso = ?, edad = ?, categoria = ?, telefono = ?, correo = ?, 
        pagado = ?, id_competencia = ?, comprobante_pago = ?
    WHERE id_competidor = ?
  `;
  await db.query(sql, [
    data.nombre,
    data.apellidos,
    data.peso,
    data.edad,
    data.categoria,
    data.telefono,
    data.correo,
    data.pagado,
    data.id_competencia,
    data.comprobante_pago,
    id,
  ]);
};

// Eliminar competidor
export const eliminarCompetidor = async (id) => {
  await db.query("DELETE FROM competidores WHERE id_competidor = ?", [id]);
};
