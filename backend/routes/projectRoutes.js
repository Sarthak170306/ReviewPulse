const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// POST /api/projects
router.post('/', projectController.createProject);

// GET /api/projects/user/:userId
router.get('/user/:userId', projectController.getProjectsByUser);

// GET /api/projects/:id/report
router.get('/:id/report', projectController.getProjectReport);

// POST /api/projects/:id/share
router.post('/:id/share', projectController.shareProject);

// POST /api/projects/:id/log
router.post('/:id/log', projectController.logProjectActivity);

// POST /api/projects/:id/webhook
router.post('/:id/webhook', projectController.updateWebhook);

// POST /api/projects/:id/fix-finding
router.post('/:id/fix-finding', projectController.generateFindingFix);

// POST /api/projects/:id/update-code
router.post('/:id/update-code', projectController.updateProjectCode);

// GET /api/projects/:id/webhooks
router.get('/:id/webhooks', projectController.getWebhooks);

// POST /api/projects/:id/webhooks
router.post('/:id/webhooks', projectController.addWebhook);

// POST /api/projects/:id/webhooks/test
router.post('/:id/webhooks/test', projectController.testWebhook);

module.exports = router;