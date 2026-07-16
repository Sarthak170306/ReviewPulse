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
    const projectInsertQuery = 'INSERT INTO projects (user_id, project_name, code_content) VALUES ($1, $2, $3) RETURNING *';
    const projectResult = await client.query(projectInsertQuery, [user_id.trim(), project_name.trim(), code_content]);
    const project = projectResult.rows[0];

    // 2. Run static analysis
    const analysisResult = analyzerService.analyzeCode(code_content, language);
    const findings = analysisResult.findings || [];
    const score = analysisResult.overall_score !== undefined ? analysisResult.overall_score : 100;

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

// Get specific project report by UUID including reviews and findings
async function getProjectReport(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'URL parameter "id" is required.' });
  }

  try {
    const projectQuery = 'SELECT id, user_id, project_name, code_content, created_at FROM projects WHERE id = $1';
    const projectRes = await pool.query(projectQuery, [id]);
    
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    const project = projectRes.rows[0];

    const reviewQuery = `
      SELECT id, review_type, overall_score, summary, created_at 
      FROM reviews 
      WHERE project_id = $1 
      ORDER BY created_at DESC LIMIT 1
    `;
    const reviewRes = await pool.query(reviewQuery, [id]);
    const review = reviewRes.rows[0] || null;

    let findingsArray = [];
    if (review) {
      const findingsQuery = `
        SELECT id, severity, issue, explanation, suggested_fix, file_name, line_number 
        FROM review_findings 
        WHERE review_id = $1 
        ORDER BY line_number ASC
      `;
      const findingsRes = await pool.query(findingsQuery, [review.id]);
      findingsArray = findingsRes.rows;
    }

    // Query collaborators
    const collaboratorsQuery = 'SELECT id, project_id, user_email, role, created_at FROM project_collaborators WHERE project_id = $1 ORDER BY created_at ASC';
    const collaboratorsRes = await pool.query(collaboratorsQuery, [id]);
    const collaboratorsArray = collaboratorsRes.rows;

    // Query activity logs
    const activityQuery = 'SELECT id, project_id, user_name, action, created_at FROM activity_logs WHERE project_id = $1 ORDER BY created_at DESC';
    const activityRes = await pool.query(activityQuery, [id]);
    const activityLogsArray = activityRes.rows;

    res.status(200).json({
      success: true,
      project: {
        id: project.id,
        project_name: project.project_name,
        code_content: project.code_content || '',
        overall_score: review ? review.overall_score : 100
      },
      findings: findingsArray,
      collaborators: collaboratorsArray,
      activityLogs: activityLogsArray
    });
  } catch (err) {
    console.error('[ProjectController] Get report error:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}

// Share a project audit with a collaborator
async function shareProject(req, res) {
  const { id } = req.params;
  const { email, role, userName } = req.body;

  if (!id || !email || !role || !userName) {
    return res.status(400).json({ error: 'Parameters "id", "email", "role", and "userName" are required.' });
  }

  try {
    const projectCheck = 'SELECT id FROM projects WHERE id = $1';
    const projectRes = await pool.query(projectCheck, [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const insertCollaboratorQuery = `
      INSERT INTO project_collaborators (project_id, user_email, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const collaboratorRes = await pool.query(insertCollaboratorQuery, [id, email.trim(), role]);

    const action = `${userName} shared this project with ${email.trim()} as ${role}`;
    const insertLogQuery = `
      INSERT INTO activity_logs (project_id, user_name, action)
      VALUES ($1, $2, $3)
    `;
    await pool.query(insertLogQuery, [id, userName, action]);

    res.status(200).json({
      success: true,
      collaborator: collaboratorRes.rows[0]
    });
  } catch (err) {
    console.error('[ProjectController] Share project error:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}

// Log general project activities
async function logProjectActivity(req, res) {
  const { id } = req.params;
  const { userName, action } = req.body;

  if (!id || !userName || !action) {
    return res.status(400).json({ error: 'Parameters "id", "userName", and "action" are required.' });
  }

  try {
    const projectCheck = 'SELECT id FROM projects WHERE id = $1';
    const projectRes = await pool.query(projectCheck, [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const insertLogQuery = `
      INSERT INTO activity_logs (project_id, user_name, action)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const logRes = await pool.query(insertLogQuery, [id, userName, action]);

    res.status(200).json({
      success: true,
      log: logRes.rows[0]
    });
  } catch (err) {
    console.error('[ProjectController] Log activity error:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}

module.exports = {
  createProject,
  getProjectsByUser,
  getProjectReport,
  shareProject,
  logProjectActivity
};
