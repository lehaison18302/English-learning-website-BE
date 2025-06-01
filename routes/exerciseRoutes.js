const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const verifyToken = require('../middleware/verifyToken');

// GET /lesson/:lessonId
router.get('/lesson/:lessonId', verifyToken, exerciseController.getExercisesByLesson);

// GET /lessons
router.get('/lessons', verifyToken, exerciseController.getAllLessons);

module.exports = router;