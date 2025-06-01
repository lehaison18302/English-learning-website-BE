const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    skillID: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    lessonID: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    type: {
        type: String,
        enum: ['translate', 'fill-in-the-blank', 'match', 'listen', 'multiple-choice'],
        required: true,
    },
    question: { type: String, required: true },
    vocabularyIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }], // for 'translate' and 'listen' types
    options: [String], // for 'fill-in-the-blank' and 'match' types
    correctAnswer: { type: String, required: true },
    audioUrl: String, // for 'listen' type
    imageUrl: String
});

module.exports = mongoose.model("Exercise", exerciseSchema);