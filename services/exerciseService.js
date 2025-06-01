const { generateExercises } = require('../utils/exerciseGenerator');
const Vocabulary = require('../models/Vocabulary');
const Exercise = require('../models/Exercise');
const Lesson = require('../models/Lesson');

const ExerciseService = {
    // Tạo bài tập cho lesson
    async generateLessonExercises(lessonId) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) throw new Error(`Lesson not found with ID: ${lessonId}`);
        const vocabList = await Vocabulary.find({ lessonID: lessonId });
        if (vocabList.length === 0) return [];
        const exercisesData = generateExercises(vocabList, lesson._id, lesson.skillID, lesson.courseID) ;

        if (exercisesData.length > 0) {
            const savedExercises = await Exercise.insertMany(exercisesData);
            lesson.exercises = savedExercises.map(ex => ex._id);
            await lesson.save();
            return savedExercises;
        }
        return [];
    },

    
    async generateReviewExercisesForVocabulary(vocabularyDoc, count = 1) {
        if (!vocabularyDoc || !vocabularyDoc._id) return [];
        const allVocabWords = [vocabularyDoc.word];
        const allVocabMeanings = [vocabularyDoc.meaning];
        const reviewExercisesData = [];
        const exerciseTypes = ['translate', 'multiple-choice']; 
        if (vocabularyDoc.audioUrl) {
            exerciseTypes.push('listen');
        }
        const selectedTypes = shuffleArray([...exerciseTypes]).slice(0, count);
       for (const type of selectedTypes) {
            let exerciseData = {
                courseID: vocabularyDoc.courseID, 
                skillID: vocabularyDoc.skillID,   
                lessonID: vocabularyDoc.lessonID, 
                vocabularyID: vocabularyDoc._id,
                xpReward: 5, 
                isReviewExercise: true, 
                sourceVocabularyId: vocabularyDoc._id 
            };

            switch (type) {
                case 'translate':
                    exerciseData = {
                        ...exerciseData,
                        type: 'translate',
                        question: `Translate: "${vocabularyDoc.word}"`,
                        correctAnswer: vocabularyDoc.meaning,
                    };
                    break;
                case 'multiple-choice':
                    if (Math.random() < 0.5) { 
                        exerciseData = {
                            ...exerciseData,
                            type: 'multiple-choice',
                            question: `What is the meaning of "${vocabularyDoc.word}"?`,
                            correctAnswer: vocabularyDoc.meaning,
                            options: shuffleArray([vocabularyDoc.meaning, ...getRandomItems(allVocabMeanings.filter(m => m !== vocabularyDoc.meaning), 3, vocabularyDoc.meaning)])
                        };
                    } else { 
                         exerciseData = {
                            ...exerciseData,
                            type: 'multiple-choice',
                            question: `Which word means "${vocabularyDoc.meaning}"?`,
                            correctAnswer: vocabularyDoc.word,
                            options: shuffleArray([vocabularyDoc.word, ...getRandomItems(allVocabWords.filter(w => w !== vocabularyDoc.word), 3, vocabularyDoc.word)])
                        };
                    }
                    break;
                case 'listen':
                    exerciseData = {
                        ...exerciseData,
                        type: 'listen',
                        question: 'Listen and type what you hear:',
                        audioUrl: vocabularyDoc.audioUrl,
                        correctAnswer: vocabularyDoc.word,
                    };
                    break;
            }
            if (exerciseData.type) {
                reviewExercisesData.push(exerciseData);
            }
        }

        if (reviewExercisesData.length > 0) {
            try {
                const savedExercises = await Exercise.insertMany(reviewExercisesData);
                console.log(`Saved ${savedExercises.length} review exercises for vocab ${vocabularyDoc.word}`);
                return savedExercises; 
            } catch (dbError) {
                console.error("Error saving review exercises to DB:", dbError);
                return []; 
            }
        }
        return [];
    }
};

module.exports =  ExerciseService;