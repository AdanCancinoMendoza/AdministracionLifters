// backend/src/models/categoriasAdminModel.js
import db from "../config/db.js";

// --- Obtener datos ---
export const getCategoriasWithGanadores = async () => {
  const [categoriasRows] = await db.query(
    "SELECT id, nombre, imagen, fecha_actualizacion FROM categoriasadmin ORDER BY id ASC"
  );

  const categoriasConGanadores = await Promise.all(
    categoriasRows.map(async (categoria) => {
      const [ganadoresRows] = await db.query(
        "SELECT id, nombre, peso, medalla FROM ganadoresadmin WHERE categoria_id = ? ORDER BY FIELD(medalla, 'oro', 'plata', 'bronce')",
        [categoria.id]
      );
      return {
        ...categoria,
        ganadores: ganadoresRows,
      };
    })
  );
  return categoriasConGanadores;
};

// --- Operaciones de Guardado (Insertar/Actualizar) ---

export const saveCategoriaAndGanadores = async (categoriaData, imagenUrl) => {
  let categoriaId;

  // Inicia una transacción para asegurar la consistencia
  const connection = await db.getConnection(); // Obtener una conexión del pool
  try {
    await connection.beginTransaction(); // Iniciar transacción

    if (categoriaData.id) {
      // Actualizar categoría existente
      let query = "UPDATE categoriasadmin SET nombre = ?";
      let params = [categoriaData.nombre];

      if (imagenUrl !== undefined) { // Solo actualiza la imagen si se proporciona una nueva
        query += ", imagen = ?";
        params.push(imagenUrl);
      }

      query += " WHERE id = ?";
      params.push(categoriaData.id);

      await connection.query(query, params);
      categoriaId = categoriaData.id;

    } else {
      // Crear nueva categoría
      const [result] = await connection.query(
        "INSERT INTO categoriasadmin (nombre, imagen) VALUES (?, ?)",
        [categoriaData.nombre, imagenUrl]
      );
      categoriaId = result.insertId;
    }

    // Eliminar ganadores antiguos para la categoría y re-insertar
    await connection.query("DELETE FROM ganadoresadmin WHERE categoria_id = ?", [categoriaId]);

    for (const ganador of categoriaData.ganadores) {
      if (ganador.nombre || ganador.peso) { // Solo inserta si hay al menos nombre o peso
        await connection.query(
          "INSERT INTO ganadoresadmin (categoria_id, nombre, peso, medalla) VALUES (?, ?, ?, ?)",
          [categoriaId, ganador.nombre || null, ganador.peso || null, ganador.medalla]
        );
      }
    }

    await connection.commit(); // Confirmar la transacción
    return categoriaId; // Devolver el ID de la categoría procesada

  } catch (error) {
    await connection.rollback(); // Deshacer la transacción en caso de error
    throw error; // Re-lanzar el error para que sea capturado por el controlador
  } finally {
    connection.release(); // Liberar la conexión de vuelta al pool
  }
};