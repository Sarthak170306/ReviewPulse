const pool = require('../config/db');

// Sync Clerk user with PostgreSQL database
async function syncUser(req, res) {
  const { id, name, email } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({
      error: 'Fields "id", "name", and "email" are required.'
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
    console.error('[UserController] Sync failed:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}

// Fetch user profile with credits
async function getUserProfile(req, res) {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Parameter "userId" is required.' });
  }

  const query = 'SELECT id, name, email, credits, created_at FROM users WHERE id = $1';

  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error('[UserController] Fetch profile failed:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}

module.exports = {
  syncUser,
  getUserProfile
};
