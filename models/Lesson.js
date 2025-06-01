const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    skillID: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    courseID: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    order: Number,
    isUnlock: { type: Boolean, default: false },
    title: { type: String, required: true },
    exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
    reward: { type: Number, default: 10 },
});

module.exports = mongoose.model("Lesson", lessonSchema);