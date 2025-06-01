const UserProgress = require('../models/UserProgress');
const SM2 = require('sm2'); // Thư viện SM2 cho SRS

class UserProgressService {
    // Tính toán thời gian ôn tập tiếp theo cho từ vựng
    async updateReviewProgress(userId, vocabId, isCorrect) {
        const progress = await UserProgress.findOne({ userID: userId });
        const vocabEntry = progress.learnedVocabulary.find(e => 
            e.vocabularyID.toString() === vocabId
        );
    
        if (!vocabEntry) throw new Error('Chưa có từ vựng được học');
    
        // Chuyển đổi đúng/sai thành quality (0-5)
        const quality = isCorrect ? 4 : 0; // 4 = trả lời đúng nhưng hơi khó
    
        // Lấy thông số hiện tại từ performance
        const { easeFactor, interval, repetitions } = vocabEntry.performance;
    
        // Tính toán bằng thư viện SM2
        const result = SM2(quality, {
            easeFactor,
            interval,
            repetitions
        });
    
        // Cập nhật performance
        if (isCorrect) {
            vocabEntry.performance.streak += 1;
            vocabEntry.performance.correctCount += 1;
        } else {
            vocabEntry.performance.streak = 0;
            vocabEntry.performance.incorrectCount += 1;
        }
    
        // Cập nhật thông số SRS
        vocabEntry.performance.easeFactor = result.easeFactor;
        vocabEntry.performance.interval = result.interval;
        vocabEntry.performance.repetitions = result.repetitions;
        
        // Tính ngày ôn tập tiếp theo
        vocabEntry.nextReview = new Date(Date.now() + result.interval * 86400000);
        vocabEntry.reviewDates.push(new Date());
    
        await progress.save();
        return {
            nextReview: vocabEntry.nextReview,
            streak: vocabEntry.performance.streak,
            easeFactor: result.easeFactor,
            interval: result.interval
        };
    }
}

module.exports = new UserProgressService();