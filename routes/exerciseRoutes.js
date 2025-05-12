const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');

// GET /lesson/:lessonId
router.get('/lesson/:lessonId', exerciseController.getExercisesByLesson);

module.exports = router; 