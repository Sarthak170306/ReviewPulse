const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase PostgreSQL cloud instances
  }
});

// Verify connection
pool.on('connect', () => {
  console.log('[Database Pool] New client connected');
});

pool.on('error', (err) => {
  console.error('[Database Pool] Unexpected error on idle client:', err.message);
});

module.exports = pool;
