const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../config/db');
const PDFDocument = require('pdfkit');

// GET /api/projects/:id/export/pdf
router.get('/pdf', async (req, res) => {
  const { id } = req.params;

  try {
    const projectQuery = 'SELECT id, project_name, code_content FROM projects WHERE id = $1';
    const projectRes = await pool.query(projectQuery, [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    const project = projectRes.rows[0];

    const reviewQuery = 'SELECT id, overall_score FROM reviews WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1';
    const reviewRes = await pool.query(reviewQuery, [id]);
    const review = reviewRes.rows[0] || null;
    const score = review ? review.overall_score : 100;

    let findings = [];
    if (review) {
      const findingsQuery = 'SELECT id, severity, issue, explanation, suggested_fix, file_name, line_number FROM review_findings WHERE review_id = $1 ORDER BY line_number ASC';
      const findingsRes = await pool.query(findingsQuery, [review.id]);
      findings = findingsRes.rows;
    }

    const activityQuery = 'SELECT id, user_name, action, created_at FROM activity_logs WHERE project_id = $1 ORDER BY created_at DESC';
    const activityRes = await pool.query(activityQuery, [id]);
    const activityLogs = activityRes.rows;

    const critCount = findings.filter(f => f.severity === 'Critical').length;
    const highCount = findings.filter(f => f.severity === 'High').length;
    const medCount = findings.filter(f => f.severity === 'Medium').length;
    const lowCount = findings.filter(f => f.severity === 'Low').length;

    let complianceStamp = "PASSED";
    let complianceColor = "#10B981";
    if (critCount > 0 || highCount > 0) {
      complianceStamp = "NON-COMPLIANT";
      complianceColor = "#EF4444";
    } else if (medCount > 2) {
      complianceStamp = "WARNING";
      complianceColor = "#F59E0B";
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=codepulse_report_${id}.pdf`);

    doc.pipe(res);

    const primaryColor = '#0F172A';
    const secondaryColor = '#2563EB';
    const lightBg = '#F8FAFC';
    const borderColor = '#E2E8F0';

    doc.fillColor(primaryColor).fontSize(20).text('CodePulse AI', { continued: true });
    doc.fillColor(secondaryColor).fontSize(10).text('   Enterprise Security Compliance Audit', { align: 'right' });
    doc.moveDown(1);
    doc.strokeColor(borderColor).lineWidth(1).moveTo(50, 80).lineTo(550, 80).stroke();
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor('#475569').text(`Project Name: ${project.project_name}`);
    doc.text(`Project UUID: ${project.id}`);
    doc.text(`Quality Score: ${score}%  |  Compliance Stamp: `, { continued: true });
    doc.fillColor(complianceColor).text(complianceStamp);
    doc.fillColor('#475569').text(`Date Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(2);

    doc.fontSize(14).fillColor(primaryColor).text('Vulnerability Severity Summary', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#1E293B');
    const summaryHeaderY = doc.y;
    doc.rect(50, summaryHeaderY, 500, 20).fill(lightBg);
    doc.fillColor('#1E293B').text('Critical', 70, summaryHeaderY + 5);
    doc.text('High', 170, summaryHeaderY + 5);
    doc.text('Medium', 270, summaryHeaderY + 5);
    doc.text('Low', 370, summaryHeaderY + 5);
    doc.text('Total', 470, summaryHeaderY + 5);

    doc.moveDown(0.8);
    const summaryRowY = doc.y;
    doc.text(critCount.toString(), 70, summaryRowY);
    doc.text(highCount.toString(), 170, summaryRowY);
    doc.text(medCount.toString(), 270, summaryRowY);
    doc.text(lowCount.toString(), 370, summaryRowY);
    doc.text(findings.length.toString(), 470, summaryRowY);
    doc.moveDown(2);

    doc.fontSize(14).fillColor(primaryColor).text('Vulnerability Details Registry', { underline: true });
    doc.moveDown(0.8);

    if (findings.length === 0) {
      doc.fontSize(10).fillColor('#64748B').text('No unresolved vulnerabilities detected. Code compliance audit holds clean status.');
    } else {
      findings.forEach((finding, index) => {
        if (doc.y > 600) {
          doc.addPage();
        }

        const severityColor = finding.severity === 'Critical' ? '#EF4444' 
                            : finding.severity === 'High' ? '#F97316' 
                            : finding.severity === 'Medium' ? '#F59E0B' 
                            : '#3B82F6';

        doc.fontSize(11).fillColor(primaryColor).text(`${index + 1}. ${finding.issue}`, { bold: true });
        doc.fontSize(9).fillColor(severityColor).text(`Severity: ${finding.severity}   |   Line Number: ${finding.line_number}`);
        doc.moveDown(0.2);
        doc.fontSize(9).fillColor('#334155').text(`Threat Scope: ${finding.explanation}`);
        doc.moveDown(0.2);
        doc.fontSize(9).fillColor('#0F766E').text(`Suggested Fix: ${finding.suggested_fix}`, { oblique: true });
        doc.moveDown(1);
      });
    }

    doc.moveDown(2);

    if (doc.y > 550) {
      doc.addPage();
    }
    doc.fontSize(14).fillColor(primaryColor).text('Audit Activity Trail Log', { underline: true });
    doc.moveDown(0.8);

    if (activityLogs.length === 0) {
      doc.fontSize(10).fillColor('#64748B').text('No activity recorded in audit trail logs.');
    } else {
      activityLogs.forEach((log) => {
        if (doc.y > 650) {
          doc.addPage();
        }
        doc.fontSize(9).fillColor('#334155').text(`[${new Date(log.created_at).toLocaleString()}] ${log.user_name}: `, { continued: true });
        doc.fillColor('#475569').text(log.action);
        doc.moveDown(0.2);
      });
    }

    doc.end();

  } catch (err) {
    console.error('[ExportController] PDF Export failed:', err.message);
    res.status(500).json({ error: 'Failed to generate PDF document report', details: err.message });
  }
});

// GET /api/projects/:id/export/json
router.get('/json', async (req, res) => {
  const { id } = req.params;

  try {
    const projectQuery = 'SELECT id, project_name, code_content FROM projects WHERE id = $1';
    const projectRes = await pool.query(projectQuery, [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    const project = projectRes.rows[0];

    const reviewQuery = 'SELECT id, overall_score FROM reviews WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1';
    const reviewRes = await pool.query(reviewQuery, [id]);
    const review = reviewRes.rows[0] || null;
    const score = review ? review.overall_score : 100;

    let findings = [];
    if (review) {
      const findingsQuery = 'SELECT id, severity, issue, explanation, suggested_fix, file_name, line_number FROM review_findings WHERE review_id = $1 ORDER BY line_number ASC';
      const findingsRes = await pool.query(findingsQuery, [review.id]);
      findings = findingsRes.rows;
    }

    const activityQuery = 'SELECT id, user_name, action, created_at FROM activity_logs WHERE project_id = $1 ORDER BY created_at DESC';
    const activityRes = await pool.query(activityQuery, [id]);
    const activityLogs = activityRes.rows;

    const critCount = findings.filter(f => f.severity === 'Critical').length;
    const highCount = findings.filter(f => f.severity === 'High').length;
    const medCount = findings.filter(f => f.severity === 'Medium').length;
    const lowCount = findings.filter(f => f.severity === 'Low').length;

    let complianceStamp = "PASSED";
    if (critCount > 0 || highCount > 0) {
      complianceStamp = "NON-COMPLIANT";
    } else if (medCount > 2) {
      complianceStamp = "WARNING";
    }

    const payload = {
      meta: {
        exportType: 'Developer Metadata Dump (JSON)',
        scanDate: new Date().toISOString(),
        scoreCard: {
          overallScore: score,
          complianceStamp: complianceStamp,
          issuesCount: findings.length,
          severityBreakdown: {
            critical: critCount,
            high: highCount,
            medium: medCount,
            low: lowCount
          }
        }
      },
      project: {
        id: project.id,
        project_name: project.project_name,
        code_content: project.code_content
      },
      findings: findings,
      activityLogs: activityLogs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=codepulse_dump_${id}.json`);
    res.status(200).json(payload);

  } catch (err) {
    console.error('[ExportController] JSON Export failed:', err.message);
    res.status(500).json({ error: 'Failed to generate JSON dump payload', details: err.message });
  }
});

module.exports = router;
