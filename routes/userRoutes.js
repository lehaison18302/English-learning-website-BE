const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const ensureDbUser = require('../middleware/ensureDbUser');

router.get('/stats', verifyToken, ensureDbUser, UserController.getUserStats);

module.exports = router;