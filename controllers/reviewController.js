const ReviewService = require('../services/reviewService');
const User = require('../models/User');

module.exports = {
    async getLearnedVocabularies(req, res) { 
        try {
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid: firebaseUid });
            const userId = userInDb._id;
            const { courseId } = req.query;
            if (!courseId) {
                return res.status(400).json({ success: false, message: "courseId là bắt buộc."});
            }
            const groupedVocabularies = await ReviewService.getReviewVocabulariesGroupedByLesson(userId, courseId);
            res.status(200).json({ success: true, data: groupedVocabularies });
        } catch (error) {
            console.error("Lỗi khi lấy từ vựng đã học:", error);
            res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ", error: error.message });
        }
    },

    async startReviewSession(req, res) {
        try {
            const firebaseUid = req.firebaseUser.uid;
            const userInDb = await User.findOne({ firebaseUid: firebaseUid });
            const userId = userInDb._id;
            const { courseId, vocabCount = 5, exercisesPerVocab = 1 } = req.body;
            if (!courseId) {
                return res.status(400).json({ success: false, message: "courseId là bắt buộc cho phiên ôn tập."});
            }

            const reviewExercises = await ReviewService.generateReviewExercisesForSession(userId, courseId, vocabCount, exercisesPerVocab);

            if (reviewExercises.length === 0) {
                return res.status(200).json({ success: true, message: "Hiện không có từ vựng nào cần ôn tập cho khóa học này.", data: [] });
            }
            res.status(200).json({ success: true, data: reviewExercises });
        } catch (error) {
            console.error("Lỗi khi bắt đầu phiên ôn tập:", error);
            res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ", error: error.message });
        }
    }
};