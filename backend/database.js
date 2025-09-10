require("dotenv").config();
const mysql = require("mysql2/promise");

// Create pool instead of single connection (better for production)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to test DB connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL database:", process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
}

module.exports = { pool, testConnection };
