const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['translate', 'fill-in-the-blank', 'match', 'listen'],
        required: true,
    },
    question: { type: String, required: true },
    options: [String], // for 'fill-in-the-blank' and 'match' types
    correctAnswer: { type: String, required: true },
    audioUrl: String, // for 'listen' type
    imageUrl: String,  
});

module.exports = mongoose.model("Exercise", exerciseSchema);