const Exercise = require('../models/Exercise');
const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');

const exerciseController = {
    // Lấy danh sách exercises của một lesson
    async getExercisesByLesson(req, res) {
        try {
            const { lessonId } = req.params;

            // Kiểm tra lesson có tồn tại
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {  
                return res.status(404).json({
                    success: false,
                    message: 'Lesson not found'
                });
            }

            // Lấy danh sách exercises của lesson
            const exercises = await Exercise.find({ lessonID: lessonId })
                .populate('vocabularyIDs', 'word pronunciation meaning examples')
                .sort({ createdAt: 1 });

            // Nhóm exercises theo vocabulary
            const exercisesByVocabulary = exercises.reduce((acc, exercise) => {
                exercise.vocabularyIDs.forEach(vocab => {
                    if (!acc[vocab._id]) {
                        acc[vocab._id] = {
                            vocabulary: vocab,
                            exercises: []
                        };
                    }
                    acc[vocab._id].exercises.push({
                        _id: exercise._id,
                        type: exercise.type,
                        question: exercise.question,
                        options: exercise.options,
                        correctAnswer: exercise.correctAnswer,
                        audioUrl: exercise.audioUrl,
                        imageUrl: exercise.imageUrl
                    });
                });
                return acc;
            }, {});

            return res.status(200).json({
                success: true,
                data: Object.values(exercisesByVocabulary)
            });

        } catch (error) {
            console.error('Error in getExercisesByLesson:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = exerciseController; 