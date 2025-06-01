const express = require('express');
const router = express.Router();
const { 
    getNextLesson,
    getExercisesByLesson, 
    completeLesson,
    submitExerciseAnswer,
    getCourseStructure,
    getLessonContent
} = require('../controllers/learningController');
const verifyToken = require('../middleware/verifyToken');
const ensureDbUser = require('../middleware/ensureDbUser');

router.get('/lessons/next', verifyToken, ensureDbUser, getNextLesson);
router.get('/lessons/:lessonId/exercises', verifyToken,ensureDbUser, getExercisesByLesson);
router.post('/lessons/:lessonId/complete', verifyToken, ensureDbUser, completeLesson);
router.post('/exercises/:exerciseId/submit', verifyToken, ensureDbUser, submitExerciseAnswer);
router.get('/lessons', verifyToken,ensureDbUser, getCourseStructure);
router.get('/lessons/:lessonId/content', verifyToken,ensureDbUser, getLessonContent);

module.exports = router;