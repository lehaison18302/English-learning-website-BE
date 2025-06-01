const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken'); // Middleware gốc của bạn
const ensureDbUser = require('../middleware/ensureDbUser'); // Middleware mới


router.post('/sync-profile', verifyToken, ensureDbUser, authController.setupUserAfterFirebaseRegistration 
);

router.get('/me', verifyToken, ensureDbUser, authController.getCurrentUserFromDb 
);

module.exports = router;