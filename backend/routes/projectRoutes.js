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

module.exports = router;