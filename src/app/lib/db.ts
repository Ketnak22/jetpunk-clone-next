'server-only'

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'jetpunk_clone_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    await connection.query(`CREATE DATABASE IF NOT EXISTS jetpunk_clone_app CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
    await connection.query(`USE jetpunk_clone_app;`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('map', 'quiz', 'matchingQuiz') NOT NULL,
        filename VARCHAR(100) NOT NULL
      );
    `);

    connection.release();
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();

async function addQuizRecord(type: 'map' | 'quiz' | 'matchingQuiz', filename: string) {
  try {
    const [result] = await pool.execute(
      "INSERT INTO quizzes (type, filename) VALUES (?, ?);",
      [type, filename]
    );
    return result;
  } catch (error) {
    console.error("Error inserting quiz record:", error);
    throw error;
  }
}

export { pool as dbPool, addQuizRecord };
