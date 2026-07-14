const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// POST /api/projects
router.post('/', projectController.createProject);

// GET /api/projects/user/:userId
router.get('/user/:userId', projectController.getProjectsByUser);

// GET /api/projects/:id/report
router.get('/:id/report', projectController.getProjectReport);

module.exports = router;
