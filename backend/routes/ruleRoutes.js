const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/rules -> Fetches all active SAST rules
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, regex_pattern, severity, description, suggested_fix, created_at FROM sast_rules ORDER BY created_at DESC');
    res.status(200).json({ success: true, rules: result.rows });
  } catch (err) {
    console.error('[RuleRoutes] Get rules error:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// POST /api/rules -> Appends a new user-defined rule into sast_rules
router.post('/', async (req, res) => {
  const { name, regexPattern, severity, description, suggestedFix } = req.body;

  if (!name || !regexPattern || !severity) {
    return res.status(400).json({ error: 'Parameters "name", "regexPattern", and "severity" are required.' });
  }

  try {
    // Validate if regex pattern compiles cleanly
    new RegExp(regexPattern);

    const insertQuery = `
      INSERT INTO sast_rules (name, regex_pattern, severity, description, suggested_fix)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      name.trim(),
      regexPattern.trim(),
      severity,
      description ? description.trim() : null,
      suggestedFix ? suggestedFix.trim() : null
    ]);

    res.status(201).json({
      success: true,
      rule: result.rows[0]
    });
  } catch (err) {
    console.error('[RuleRoutes] Add rule error:', err.message);
    res.status(500).json({ error: 'Failed to save rule. Ensure regex pattern is valid.', details: err.message });
  }
});

module.exports = router;
