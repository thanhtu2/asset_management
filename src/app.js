const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// DB connection (reuse existing)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'host.docker.internal',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: 'asset_management'
});

// Test route
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as healthy');
    res.json({ status: 'OK', healthy: rows[0].healthy });
  } catch (error) {
    res.status(500).json({ error: 'DB connection failed' });
  }
});

app.get('/api/assets', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM assets LIMIT 10');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Asset Management API running on port ${PORT}`);
});

