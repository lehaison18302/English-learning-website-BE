const { generateExercises } = require('../utils/exerciseGenerator');
const Vocabulary = require('../models/Vocabulary');
const Exercise = require('../models/Exercise');

const ExerciseService = {
    // Tạo bài tập cho lesson
    async generateLessonExercises(lessonId) {
        const vocabList = await Vocabulary.find({ lessonID: lessonId });
        const exercises = generateExercises(vocabList);

        //lưu vào db
        await Exercise.insertMany(exercises);
        return exercises;
    },

};

module.exports = new ExerciseService();