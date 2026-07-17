const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

    // Create project_collaborators table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_collaborators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        role TEXT CHECK (role IN ('Viewer', 'Editor')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create activity_logs table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create webhook_url column if not exists in projects table
    await client.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS webhook_url TEXT;
    `);

    // Create sast_rules table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS sast_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        regex_pattern TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT,
        suggested_fix TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed sast_rules baseline corporate signatures if empty
    const rulesCountRes = await client.query('SELECT COUNT(*) FROM sast_rules');
    if (parseInt(rulesCountRes.rows[0].count, 10) === 0) {
      console.log('[Database] Seeding sast_rules with baseline corporate signatures...');
      await client.query(`
        INSERT INTO sast_rules (name, regex_pattern, severity, description, suggested_fix)
        VALUES 
          ('Hardcoded JWT Secret', 'jwt\\.sign\\(.*[''"][a-zA-Z0-9_-]+[''"]\\)', 'High', 'Exposed private signature secret keys detected inside JWT signing parameters.', 'process.env.JWT_SECRET'),
          ('Raw SQL String Concatenation', 'SELECT\\s.*\\sFROM\\s.*\\s\\+\\s[a-zA-Z0-9_-]+', 'High', 'Raw query concatenation detected. High risk of SQL Injection (SQLi) vulnerabilities.', 'Use parameterized queries or ORM abstractions.'),
          ('Exposed AWS Credentials', '(A3T[A-Z0-9]|AKIA|AGPA|AIDA)[A-Z0-9]{16}', 'Critical', 'Plaintext AWS Access Key ID exposed directly inside source files.', 'Rotate current AWS tokens and extract variables into a secure cloud vault environment.'),
          ('Hardcoded Credential Key', '(password|passwd|secret|token|key)\\s*=\\s*[''"][a-zA-Z0-9_-]+[''"]', 'High', 'Plaintext secret or credential key detected in source code. This poses a major security threat if exposed.', 'Move secret key to environment variables (process.env) or config vaults.'),
          ('Leftover console.log statement', 'console\\.log\\(.*\\)', 'Low', 'Production code should avoid print logs to prevent performance drops or console leakage.', 'Remove console.log or replace it with a structured logging module.')
      `);
    }

    console.log('[Database] Collaborators, Activity, Webhook, and SAST rules tables initialized successfully');
    client.release();
  } catch (err) {
    dbConnected = false;
    dbErrorMsg = err.message;
    console.error('[Database] Connection or table setup failed:', err.message);
  }
}

checkDatabaseConnection();

// Wire up API Routes
const ruleRoutes = require('./routes/ruleRoutes');
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/rules', ruleRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
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
