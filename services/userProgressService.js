const UserProgress = require('../models/UserProgress');
const Vocabulary = require('../models/Vocabulary'); 
const QuestService = require('./questService'); 

class UserProgressService {
    // Tính toán thời gian ôn tập tiếp theo cho từ vựng
    async updateReviewProgress(userId, courseId, vocabId, lessonId, isCorrect, vocabDoc = null) {
        const progress = await UserProgress.findOne({ userID: userId, courseID: courseId });
        if (!progress) {
            console.error(`UserProgress not found for SRS update. UserID: ${userId}, CourseID: ${courseId}`);
            return null; 
        }

        let vocabEntry = progress.learnedVocabulary.find(e =>
            e.vocabularyID && e.vocabularyID.toString() === vocabId.toString()
        );

        let isNewLearnedVocab = false;
        if (!vocabEntry) {
            const vocabDetails = vocabDoc || await Vocabulary.findById(vocabId);
            if (!vocabDetails) {
                console.error(`Vocabulary ${vocabId} not found for SRS update.`);
                throw new Error(`Vocabulary ${vocabId} not found.`);
            }
            vocabEntry = {
                vocabularyID: vocabDetails._id,
                lessonID: lessonId || vocabDetails.lessonID,
                reviewDates: [],
                nextReview: new Date(), 
                performance: {
                    correctCount: 0,
                    incorrectCount: 0,
                    streak: 0,
                    interval: 0,
                    repetition: 0,
                    efactor: 2.5
                }
            };
            progress.learnedVocabulary.push(vocabEntry);
            isNewLearnedVocab = true;
        }

        // Chất lượng (quality) cho supermemo thường từ 0-5
        let quality;
        if (isCorrect) {
            if (vocabEntry.performance.repetition === 0) { 
                quality = 5; 
            } else if (vocabEntry.performance.streak > 2) { 
                quality = 4; 
            } else { 
                quality = 3; 
            }
        } else {
            quality = 1;
        }

        console.log('[UserProgressService] SRS Input:', {
            quality,
            interval: vocabEntry.performance.interval,
            repetition: vocabEntry.performance.repetition,
            efactor: vocabEntry.performance.efactor
        });

        // SỬA LỖI: Thay thế thư viện bằng thuật toán SM2 tự cài đặt
        const sm2Result = this.calculateSM2(
            quality,
            vocabEntry.performance.interval,
            vocabEntry.performance.repetition,
            vocabEntry.performance.efactor
        );

        console.log('[UserProgressService] SRS Result:', sm2Result);

        // Cập nhật thông tin performance
        if (isCorrect) {
            vocabEntry.performance.streak = (vocabEntry.performance.streak || 0) + 1;
            vocabEntry.performance.correctCount = (vocabEntry.performance.correctCount || 0) + 1;
        } else { 
            vocabEntry.performance.streak = 0;
            vocabEntry.performance.incorrectCount = (vocabEntry.performance.incorrectCount || 0) + 1;
        }

        // Cập nhật từ kết quả SM2
        vocabEntry.performance.repetition = sm2Result.repetition;
        vocabEntry.performance.interval = sm2Result.interval;
        vocabEntry.performance.efactor = sm2Result.efactor;

        // Tính toán ngày ôn tập tiếp theo
        const currentDate = new Date();
        const nextReviewDate = new Date(currentDate);
        nextReviewDate.setDate(currentDate.getDate() + sm2Result.interval);
        vocabEntry.nextReview = nextReviewDate;

        vocabEntry.reviewDates.push(new Date());

        await progress.save();

        if (isCorrect && QuestService && typeof QuestService.handleEvent === 'function') {
            try {
                await QuestService.handleEvent(userId, 'VOCABULARY_REVIEWED', { count: 1 });
            } catch (error) {
                console.error('Error calling QuestService:', error);
            }
        }

        return {
            interval: vocabEntry.performance.interval,
            repetition: vocabEntry.performance.repetition,
            efactor: vocabEntry.performance.efactor,
            nextReview: vocabEntry.nextReview,
            streak: vocabEntry.performance.streak,
            isNew: isNewLearnedVocab && isCorrect
        };
    }

    // THÊM HÀM TỰ CÀI ĐẶT THUẬT TOÁN SM2
    calculateSM2(quality, previousInterval, previousRepetitions, previousEfactor) {
        let efactor = (typeof previousEfactor === 'number' && !isNaN(previousEfactor) && previousEfactor >= 1.3) 
            ? previousEfactor : 2.5;
    
        let interval = (typeof previousInterval === 'number' && !isNaN(previousInterval) && previousInterval >= 0) 
        ? previousInterval : 0;
    
        let repetition = (typeof previousRepetitions === 'number' && !isNaN(previousRepetitions) && previousRepetitions >= 0) 
        ? previousRepetitions : 0;

        if (quality >= 3) { // Câu trả lời đúng
            if (repetition === 0) {
                interval = 1;
            } else if (repetition === 1) {
                interval = 6;
            } else {
                interval = Math.round(previousInterval * efactor);
            }
            
            repetition += 1;
            
            efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (efactor < 1.3) efactor = 1.3;
        } else { 
            repetition = 0;
            interval = 1;
        }

        return {
            interval,
            repetition,
            efactor: parseFloat(efactor.toFixed(2))
        };
    }
}

module.exports = new UserProgressService();