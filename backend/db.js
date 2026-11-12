
require("dotenv").config();

const mysql = require("mysql2");

const ca = process.env.DB_CA_CERT
  ? process.env.DB_CA_CERT.replace(/\\n/g, "\n")
  : undefined;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: ca ? { ca } : undefined,
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("Aiven MySQL connected successfully!");
});

module.exports = db;
