const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// POST /api/projects
router.post('/', projectController.createProject);

// GET /api/projects/user/:userId
router.get('/user/:userId', projectController.getProjectsByUser);

module.exports = router;
