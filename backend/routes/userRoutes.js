const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users/sync
router.post('/sync', userController.syncUser);

module.exports = router;
