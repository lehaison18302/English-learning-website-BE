const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');

// GET /lesson/:lessonId
router.get('/lesson/:lessonId', exerciseController.getExercisesByLesson);

// GET /lessons
router.get('/lessons', exerciseController.getAllLessons);

module.exports = router; 