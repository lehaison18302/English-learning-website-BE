// models/Pronunciation.js
const mongoose = require('mongoose');

const PronunciationSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  type: { type: String, enum: ['vowel', 'consonant'], required: true },
  exampleWord: {
    word: { type: String, required: true },
    audioUrl: { type: String },
    IPA_AudioUrl: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

// Model name sẽ ánh xạ đến collection "pronunciations"
const Pronunciation = mongoose.model('Pronunciation', PronunciationSchema);

module.exports = Pronunciation;
