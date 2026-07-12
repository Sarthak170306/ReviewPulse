const pool = require('../config/db');

// Create a new project and deduct 1 credit
async function createProject(req, res) {
  const { user_id, project_name, code_content } = req.body;

  // Validate fields
  if (!user_id || !user_id.trim()) {
    return res.status(400).json({ error: 'Field "user_id" is required.' });
  }
  if (!project_name || !project_name.trim()) {
    return res.status(400).json({ error: 'Field "project_name" is required.' });
  }
  if (!code_content || !code_content.trim()) {
    return res.status(400).json({ error: 'Field "code_content" is required.' });
  }

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Fetch user credits with a lock
    const userQuery = 'SELECT credits FROM users WHERE id = $1 FOR UPDATE';
    const userResult = await client.query(userQuery, [user_id.trim()]);

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found.' });
    }

    const currentCredits = userResult.rows[0].credits;

    if (currentCredits === null || currentCredits <= 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Insufficient Credits', code: 'CREDIT_EXHAUSTED' });
    }

    // Insert project and decrement user credits
    const projectInsertQuery = 'INSERT INTO projects (user_id, project_name) VALUES ($1, $2) RETURNING *';
    const projectResult = await client.query(projectInsertQuery, [user_id.trim(), project_name.trim()]);
    const project = projectResult.rows[0];

    const creditDecrementQuery = 'UPDATE users SET credits = credits - 1 WHERE id = $1';
    await client.query(creditDecrementQuery, [user_id.trim()]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Project created successfully',
      project_id: project.id,
      project
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ProjectController] Error:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    client.release();
  }
}

// Get all projects for a user
async function getProjectsByUser(req, res) {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Parameter "userId" is required.' });
  }

  const query = 'SELECT * FROM projects WHERE user_id = $1 ORDER BY id DESC';

  try {
    const result = await pool.query(query, [userId]);
    res.status(200).json({ projects: result.rows });
  } catch (err) {
    console.error('[ProjectController] Error:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}

module.exports = {
  createProject,
  getProjectsByUser
};
