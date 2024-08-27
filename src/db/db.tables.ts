import pool from "./db.config";

async function createTables() {
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  const createFilmReviewsTableQuery = `
    CREATE TABLE IF NOT EXISTS film_reviews (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      title VARCHAR(255),
      rating INTEGER,
      genre VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    const client = await pool.connect();

    await client.query(createUsersTableQuery);
    await client.query(createFilmReviewsTableQuery);

    console.log("Таблицы успешно созданы.");

    client.release();
  } catch (err) {
    console.error("Ошибка при создании таблиц:", err);
  } finally {
    await pool.end();
  }
}

createTables();
