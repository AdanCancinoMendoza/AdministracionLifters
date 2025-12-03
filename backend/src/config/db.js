import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear pool de conexiones
const db = mysql.createPool({
  host: process.env.DB_HOST || "mysql-bso80c84g4gcw4skc0cccws0.internal",
  user: process.env.DB_USER || "mysql",
  password: process.env.DB_PASSWORD || "raFQ6d1AQDbQPcQSEHU4ew6y76QUJfj6gLaG8tTIh26KWy7hqGXf1zz7fh7f6ZBC",
  database: process.env.DB_NAME || "default",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4' 

});

// Probar la conexión
db.getConnection()
  .then((conn) => {
    console.log("✅ Conectado a MySQL");
    conn.release();
  })
  .catch((err) => console.error("❌ Error de conexión:", err));

export default db;
