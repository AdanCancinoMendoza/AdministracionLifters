import db from "../config/db.js";

// Crear juez
export const crearJuez = async (data) => {
  const sql = `
    INSERT INTO JuezAdmin
    (id_competencia, nombre, apellidos, usuario, password)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    data.id_competencia,
    data.nombre,
    data.apellidos,
    data.usuario,
    data.password,
  ];
  const [result] = await db.query(sql, values);

  // Devolver el juez completo con ID insertado
  return { id_juez: result.insertId, ...data };
};

// Obtener todos los jueces
export const obtenerJueces = async () => {
  const [rows] = await db.query("SELECT * FROM JuezAdmin");
  return rows;
};

// Obtener jueces por competencia
export const obtenerJuecesPorCompetencia = async (id_competencia) => {
  const [rows] = await db.query(
    "SELECT * FROM JuezAdmin WHERE id_competencia = ?",
    [id_competencia]
  );
  return rows;
};

// Obtener juez por ID
export const obtenerJuezPorId = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM JuezAdmin WHERE id_juez = ?",
    [id]
  );
  return rows[0];
};

// Actualizar juez
export const editarJuez = async (id, data) => {
  const sql = `
    UPDATE JuezAdmin SET
      nombre = ?, apellidos = ?, usuario = ?, password = ?
    WHERE id_juez = ?
  `;
  const [result] = await db.query(sql, [
    data.nombre,
    data.apellidos,
    data.usuario,
    data.password,
    id,
  ]);
  return result.affectedRows;
};

// Eliminar juez
export const eliminarJuez = async (id) => {
  const [result] = await db.query(
    "DELETE FROM JuezAdmin WHERE id_juez = ?",
    [id]
  );
  return result.affectedRows;
};
