const pool = require('../config/db');
const analyzerService = require('../services/analyzerService');

// Create a new project and deduct 1 credit
async function createProject(req, res) {
  console.log("📥 BACKEND ROUTE HIT! Incoming body payload:", req.body);
  const { user_id, project_name, code_content, language = 'javascript' } = req.body;

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
    console.log("🔍 CREDITS CHECK FOR USER:", user_id, "BALANCE:", currentCredits);

    if (currentCredits === null || currentCredits <= 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Insufficient Credits', code: 'CREDIT_EXHAUSTED' });
    }

    // 1. Insert project
    const projectInsertQuery = 'INSERT INTO projects (user_id, project_name) VALUES ($1, $2) RETURNING *';
    const projectResult = await client.query(projectInsertQuery, [user_id.trim(), project_name.trim()]);
    const project = projectResult.rows[0];

    // 2. Run static analysis
    const findings = analyzerService.analyzeCode(code_content, language) || [];

    // Calculate score (High: -20, Medium: -10, Low: -5, Min: 10)
    let score = 100;
    findings.forEach(f => {
      if (f.severity === 'High') score -= 20;
      else if (f.severity === 'Medium') score -= 10;
      else if (f.severity === 'Low') score -= 5;
    });
    if (score < 10) score = 10;

    const summary = `Static analysis complete. Found ${findings.length} issue(s). Quality score: ${score}/100.`;

    // 3. Insert parent review
    const reviewInsertQuery = `
      INSERT INTO reviews (project_id, review_type, overall_score, summary)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const reviewResult = await client.query(reviewInsertQuery, [project.id, 'static', score, summary]);
    const review = reviewResult.rows[0];

    // 4. Insert review findings
    if (findings.length > 0) {
      const findingInsertQuery = `
        INSERT INTO review_findings (review_id, severity, issue, explanation, suggested_fix, file_name, line_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      for (const finding of findings) {
        await client.query(findingInsertQuery, [
          review.id,
          finding.severity,
          finding.issue,
          finding.explanation,
          finding.suggested_fix,
          'code_snippet.txt',
          finding.line_number
        ]);
      }
    }

    // 5. Decrement user credits
    const creditDecrementQuery = 'UPDATE users SET credits = credits - 1 WHERE id = $1';
    await client.query(creditDecrementQuery, [user_id.trim()]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Project created and code analyzed successfully',
      project_id: project.id,
      review_id: review.id,
      overall_score: score,
      findings_count: findings.length,
      findings
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ TRANSACTION CRASH DETAILS:", err);
    res.status(500).json({ 
      error: 'Database operation failed', 
      details: err.message,
      stack: err.stack 
    });
  } finally {
    client.release();
  }
}

// Get all projects for a user with review scores and vulnerability counts
async function getProjectsByUser(req, res) {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Parameter "userId" is required.' });
  }

  const query = `
    SELECT 
      p.id,
      p.user_id,
      p.project_name,
      p.created_at,
      r.overall_score,
      COUNT(rf.id)::int AS vulnerability_count
    FROM projects p
    LEFT JOIN reviews r ON r.project_id = p.id
    LEFT JOIN review_findings rf ON rf.review_id = r.id
    WHERE p.user_id = $1
    GROUP BY p.id, r.overall_score, r.id
    ORDER BY p.created_at DESC
  `;

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
