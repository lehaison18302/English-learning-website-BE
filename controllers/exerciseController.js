const Exercise = require('../models/Exercise');
const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');

const exerciseController = {
    // Lấy danh sách exercises của một lesson
    async getExercisesByLesson(req, res) {
        try {
            const { lessonId } = req.params;

            // Tìm lesson theo id
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            // Lấy danh sách exercises theo mảng id trong lesson
            const exercises = await Exercise.find({ _id: { $in: lesson.exercises } })
                .populate('vocabularyID', 'word pronunciation meaning examples')
                .sort({ createdAt: 1 });

            return res.status(200).json({
                success: true,
                data: exercises
            });

        } catch (error) {
            console.error('Error in getExercisesByLesson:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    // Lấy tất cả thông tin của tất cả lesson
    async getAllLessons(req, res) {
        try {
            const lessons = await Lesson.find();
            return res.status(200).json({
                success: true,
                data: lessons
            });
        } catch (error) {
            console.error('Error in getAllLessons:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = exerciseController; 