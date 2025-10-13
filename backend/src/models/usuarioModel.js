import { db } from "../config/db.js";

export const Usuario = {
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM usuarios");
    return rows;
  },

  create: async (nombre, correo) => {
    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, correo) VALUES (?, ?)",
      [nombre, correo]
    );
    return result.insertId;
  }
};
