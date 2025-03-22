const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    skillID: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    title: { type: String, required: true },
    exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
    reward: { type: Number, default: 10 },
});

module.exports = mongoose.model("Lesson", lessonSchema);