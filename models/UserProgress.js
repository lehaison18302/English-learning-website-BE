const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseID: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  learnedVocabulary: [
    {
      vocabularyID: { type: mongoose.Schema.Types.ObjectId, ref: "Vocabulary" },
      lessonID: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
      reviewDates: [Date],
      nextReview: Date,
      performance: {
        correctCount: { type: Number, default: 0 },
        incorrectCount: { type: Number, default: 0 },
        streak: { type: Number, default: 0 }, // số lần liên tiếp trả lời đúng
        easeFactor: { type: Number, default: 2.5 }, // hệ số dễ dàng
        interval: { type: Number, default: 1 }, // khoảng thời gian giữa các lần ôn tập
        repetitions: { type: Number, default: 0 }, // số lần ôn tập
      },
    }
  ],
  completedLessons: [
    {
      lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
      score: Number,
      completedAt: Date,
    },
  ],
  currentSkill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill" }, 
  totalXp: { type: Number, default: 0 },
  streak: {
    current: { type: Number, default: 0 },
    lastActive: Date,
  },
});

module.exports = mongoose.model("UserProgress", userProgressSchema);