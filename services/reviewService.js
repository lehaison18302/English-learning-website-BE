const UserProgress = require('../models/UserProgress');

class ReviewService {
    // Lấy danh sách từ đã học của người dùng theo bài học
    async getReviewVocabularies(userId) {
        const progress = await UserProgress.findOne({ userID: userId })
        .populate({
            path: 'learnedVocabulary.vocabularyID',
            select: 'word pronunciation audioUrl meaning',
            populate: [
                { path: 'lessonID', select: 'title' },
                { path: 'skillID', select: 'title' },
            ]
        });
        if(!progress?.learnedVocabulary) return [];
        return this.groupByLessons(progress.learnedVocabulary);
    }

    groupByLessons(learnedItems) {
        const lessonsMap = new Map();
        
        learnedItems.forEach(item => {
            const lesson = item.vocabularyID.lessonID;
            if (!lesson) return; 
            
            const lessonId = lesson._id.toString();
            if (!lessonsMap.has(lessonId)) {
                lessonsMap.set(lessonId, {
                lessonId,
                vocabularies: []
                });
            }
            
            lessonsMap.get(lessonId).vocabularies.push({
                ...item.vocabularyID.toObject(),
                lastReviewed: item.reviewDates.slice(-1)[0],
                nextReview: item.nextReview
            });
        });

        return Array.from(lessonsMap.values());
    }

    // Lấy danh sách từ cần ôn tập theo thứ tự ưu tiên
    async getPriorityReview(userId) {
        const now = new Date();
        
        const progress = await UserProgress.findOne({ userID: userId })
            .populate({
                path: 'learnedVocabulary.vocabularyID',
                select: 'word pronunciation audioUrl meaning'
            });
    
        if (!progress?.learnedVocabulary) return [];
    
        // Lọc từ cần ôn tập (đã đến hoặc vượt ngày nextReview)
        const dueVocabularies = progress.learnedVocabulary.filter(item => 
            item.nextReview && item.nextReview <= now
        );
    
        // Sắp xếp ưu tiên: từ khó nhất (sai nhiều, ease thấp, streak thấp) lên đầu
        return dueVocabularies.sort((a, b) => {
            // Tính điểm ưu tiên cho từng từ
            const priorityA = this.calculatePriority(a.performance);
            const priorityB = this.calculatePriority(b.performance);
            
            return priorityB - priorityA; // Sắp xếp giảm dần
        });
    }
    
    // Công thức tính điểm ưu tiên
    calculatePriority(performance) {
        const { incorrectCount = 0, streak = 0, easeFactor = 2.5 } = performance;
        
        // Công thức ưu tiên:
        // - Sai càng nhiều (incorrectCount) → ưu tiên cao
        // - Ease factor càng thấp (từ khó) → ưu tiên cao
        // - Streak càng thấp → ưu tiên cao
        return (incorrectCount * 100) + (1 / easeFactor * 10) - (streak * 5);
    }
}

module.exports = new ReviewService();