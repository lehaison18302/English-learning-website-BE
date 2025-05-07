const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
    word: { type: String, required: true },
    pronunciation: String,
    audioUrl: String,
    meaning: { type: String, required: true },
    examples: [String],
    skillID: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true},
    lessonID: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true},
    courseID: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true},
    meta: {
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        lastReviewed: Date,
    }
}, { timestamps: true });

module.exports = mongoose.model('Vocabulary', vocabularySchema);