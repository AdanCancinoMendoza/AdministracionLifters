import db from "../config/db.js";

// Obtener datos de inicio (solo 1 registro)
export const obtenerInicio = async () => {
  const [rows] = await db.query("SELECT * FROM inicioadmin LIMIT 1");
  return rows[0];
};

// Actualizar texto e imagen
export const actualizarInicio = async (Descripcion, Imagen) => {
  const query = `
    UPDATE inicioadmin 
    SET Descripcion = ?, Imagen = ?, actualizado = NOW() 
    WHERE ID = 1
  `;
  console.log("Query:", query, "Params:", [Descripcion, Imagen]);
  await db.query(query, [Descripcion, Imagen]);
};
