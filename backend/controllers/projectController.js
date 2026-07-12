const pool = require('../config/db');

/**
 * Create a new project.
 * POST /api/projects
 */
async function createProject(req, res) {
  const { user_id, project_name, code_content } = req.body;

  // Enforce validation rules
  if (!user_id || !user_id.trim()) {
    return res.status(400).json({
      error: 'Invalid request. Field "user_id" is required and cannot be empty.'
    });
  }

  if (!project_name || !project_name.trim()) {
    return res.status(400).json({
      error: 'Invalid request. Field "project_name" is required and cannot be empty.'
    });
  }

  if (!code_content || !code_content.trim()) {
    return res.status(400).json({
      error: 'Invalid request. Code snippet or source file content ("code_content") is required and cannot be empty.'
    });
  }

  const query = `
    INSERT INTO projects (user_id, project_name) 
    VALUES ($1, $2) 
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [user_id.trim(), project_name.trim()]);
    const project = result.rows[0];
    res.status(201).json({
      message: 'Project created and code submitted successfully',
      project_id: project.id,
      project: project
    });
  } catch (err) {
    console.error('[ProjectController] Database insertion failed:', err.message);
    res.status(500).json({
      error: 'Database operation failed',
      details: err.message
    });
  }
}

/**
 * Retrieve all projects for a specific user ID.
 * GET /api/projects/user/:userId
 */
async function getProjectsByUser(req, res) {
  const { userId } = req.params;

  // Simple validation
  if (!userId) {
    return res.status(400).json({
      error: 'URL parameter "userId" is required.'
    });
  }

  const query = `
    SELECT * FROM projects 
    WHERE user_id = $1 
    ORDER BY id DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    res.status(200).json({
      projects: result.rows
    });
  } catch (err) {
    console.error('[ProjectController] Database query failed:', err.message);
    res.status(500).json({
      error: 'Database operation failed',
      details: err.message
    });
  }
}

module.exports = {
  createProject,
  getProjectsByUser
};
