const mongoose = require('mongoose');
const Vocabulary = require('./Vocabulary');

const exerciseSchema = new mongoose.Schema({
    courseID: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    skillID: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    lessonID: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    vocabularyID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true },
    type: {
        type: String,
        enum: ['translate', 'fill-in-the-blank', 'match', 'listen', 'multiple-choice'],
        required: true,
    },
    question: { type: String, required: true },
    options: [String], // for 'fill-in-the-blank' and 'match' types
    correctAnswer: { type: String, required: true },
    audioUrl: String, // for 'listen' type
    imageUrl: String,
    xpReward: { type: Number, default: 20 }
});

module.exports = mongoose.model("Exercise", exerciseSchema);