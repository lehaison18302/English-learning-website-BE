const UserProgress = require('../models/UserProgress');
const ExerciseService = require('./exerciseService');
const Vocabulary = require('../models/Vocabulary');

class ReviewService {
    // Lấy danh sách từ đã học của người dùng theo bài học
    async getReviewVocabulariesGroupedByLesson(userId, courseId) {
        const progress = await UserProgress.findOne({ userID: userId, courseID: courseId})
        .populate({
                 path: 'learnedVocabulary.vocabularyID',
                 model: 'Vocabulary',
                 populate: {
                     path: 'lessonID',
                     model: 'Lesson',
                     select: 'title order'
                 }
             });

        if (!progress || !progress.learnedVocabulary || progress.learnedVocabulary.length === 0) {
             return [];
        }
        const lessonsMap = new Map();
        progress.learnedVocabulary.forEach(item => {
            if (!item.vocabularyID || !item.vocabularyID.lessonID) return;

            const lesson = item.vocabularyID.lessonID;
            const lessonIdStr = lesson._id.toString();

            if (!lessonsMap.has(lessonIdStr)) {
                lessonsMap.set(lessonIdStr, {
                    lessonId: lesson._id,
                    lessonTitle: lesson.title,
                    lessonOrder: lesson.order,
                    vocabularies: []
                });
            }
            lessonsMap.get(lessonIdStr).vocabularies.push({
                _id: item.vocabularyID._id,
                word: item.vocabularyID.word,
                pronunciation: item.vocabularyID.pronunciation,
                audioUrl: item.vocabularyID.audioUrl,
                meaning: item.vocabularyID.meaning,
                lastReviewed: item.reviewDates && item.reviewDates.length > 0 ? item.reviewDates.slice(-1)[0] : null,
                nextReview: item.nextReview,
                performance: item.performance
            });
        });
        return Array.from(lessonsMap.values())
            .sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0))
            .map(lesson => {
                lesson.vocabularies.sort((va, vb) => va.word.localeCompare(vb.word));
                return lesson;
            });
    }

    // Lấy danh sách từ cần ôn tập theo thứ tự ưu tiên
    async getPriorityReviewVocabularies(userId, courseId, limit = 10) {
        const now = new Date();
        
        const progress = await UserProgress.findOne({ userID: userId, courseID: courseId })
            .populate({
                path: 'learnedVocabulary.vocabularyID',
                model: 'Vocabulary',
                select: 'word pronunciation audioUrl meaning'
            });
    
        if (!progress?.learnedVocabulary) return [];
    
        // Lọc từ cần ôn tập (đã đến hoặc vượt ngày nextReview)
        const dueVocabularies = progress.learnedVocabulary
        .filter(item =>{
            return item.vocabularyID && item.nextReview && new Date(item.nextReview) <= now;
            })
            .map(item => {
                return {
                    ...item.vocabularyID.toObject(),
                    performanceData: item.performance,
                    nextReviewDate: item.nextReview,
                };
            })
            .sort((a, b) => {
                const nextReviewDiff = new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
                if (nextReviewDiff !== 0) return nextReviewDiff;

                const priorityA = this.calculatePriority(a.performanceData);
                const priorityB = this.calculatePriority(b.performanceData);
                return priorityB - priorityA;
            });

        return dueVocabularies.slice(0, limit);
    }
    
    // Công thức tính điểm ưu tiên
    calculatePriority(performance) {
        if (!performance) return 0;
        const { incorrectCount = 0, streak = 0, easeFactor = 2.5, repetitions = 0  } = performance;
        if (repetitions === 0) return 1000;
        return (incorrectCount * 100) + (1 / (easeFactor || 2.5) * 50) - (streak * 10) - (repetitions * 5);
    }

    async generateReviewExercisesForSession(userId, courseId, vocabCount = 5, exercisesPerVocab = 1) {
        const priorityVocabs = await this.getPriorityReviewVocabularies(userId, courseId, vocabCount);
        if (priorityVocabs.length === 0 || !priorityVocabs) {
            return [];
        }
        let allReviewExercises = [];
        for (const vocab of priorityVocabs) {
            const exercisesForThisVocab = await ExerciseService.generateReviewExercisesForVocabulary(vocab, exercisesPerVocab);
            allReviewExercises.push(...exercisesForThisVocab);
        }
        return shuffleArray(allReviewExercises);
    }
}

module.exports = new ReviewService();