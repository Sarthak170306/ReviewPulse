const pool = require('../config/db');

/**
 * Synchronize user from Clerk auth webhook/frontend trigger.
 * Safe UPSERT based on unique user email.
 * POST /api/users/sync
 */
async function syncUser(req, res) {
  const { id, name, email } = req.body;

  // Simple request body validation
  if (!id || !name || !email) {
    return res.status(400).json({
      error: 'Invalid request body. Fields "id", "name", and "email" are required.'
    });
  }

  const query = `
    INSERT INTO users (id, name, email) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (email) 
    DO UPDATE SET name = EXCLUDED.name, id = EXCLUDED.id
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [id, name, email]);
    res.status(200).json({
      message: 'User synchronized successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('[UserController] Database UPSERT failed:', err.message);
    res.status(500).json({
      error: 'Database operation failed',
      details: err.message
    });
  }
}

module.exports = {
  syncUser
};
