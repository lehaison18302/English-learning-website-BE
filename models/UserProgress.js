const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  completedLessons: [
    {
      lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
      score: Number,
      completedAt: Date,
    },
  ],
  currentSkill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill" }, 
  totalXp: { type: Number, default: 0 },
});

module.exports = mongoose.model("UserProgress", userProgressSchema);