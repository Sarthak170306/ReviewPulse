const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase in many environments
  }
});

// Verify database connection at startup
let dbConnected = false;
let dbErrorMsg = null;

async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    dbConnected = true;
    dbErrorMsg = null;
    console.log(`[Database] Connected successfully to Supabase PostgreSQL at ${res.rows[0].now}`);
    client.release();
  } catch (err) {
    dbConnected = false;
    dbErrorMsg = err.message;
    console.error('[Database] Connection failed:', err.message);
  }
}

checkDatabaseConnection();

// API Routes
app.get('/api/health', async (req, res) => {
  // Re-check db if it was failing, just to be resilient
  if (!dbConnected) {
    await checkDatabaseConnection();
  }

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date(),
    database: {
      connected: dbConnected,
      error: dbErrorMsg
    },
    service: 'codepulse-backend'
  });
});

// Basic landing endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CodePulse AI API is up and running.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
