const express = require('express');
const router = express.Router();
const { getLearnedVocabularies, startReviewSession } = require('../controllers/reviewController');
const verifyToken = require('../middleware/verifyToken');
const ensureDbUser = require('../middleware/ensureDbUser');

router.get('/vocabularies', verifyToken, ensureDbUser, getLearnedVocabularies);
router.post('/session/start', verifyToken, ensureDbUser, startReviewSession);

module.exports = router;