import pool from "./db.config";

async function createTables() {
  // SQL-запросы для создания таблиц
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS film_reviews (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      title VARCHAR(255),
      rating INTEGER,
      genre VARCHAR(255)
    );
  `;

  try {
    const client = await pool.connect();

    await client.query(createUsersTableQuery);

    console.log("Таблицы успешно созданы.");

    client.release();
  } catch (err) {
    console.error("Ошибка при создании таблиц:", err);
  } finally {
    await pool.end();
  }
}

createTables();
