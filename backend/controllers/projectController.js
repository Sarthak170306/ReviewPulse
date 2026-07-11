const pool = require('../config/db');

/**
 * Create a new project.
 * POST /api/projects
 */
async function createProject(req, res) {
  const { user_id, project_name } = req.body;

  // Simple validation
  if (!user_id || !project_name) {
    return res.status(400).json({
      error: 'Invalid request body. Fields "user_id" and "project_name" are required.'
    });
  }

  const query = `
    INSERT INTO projects (user_id, project_name) 
    VALUES ($1, $2) 
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [user_id, project_name]);
    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0]
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
