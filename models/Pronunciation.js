const mongoose = require('mongoose');

const pronunciationSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  type: { type: String, enum: ['vowel', 'consonant', 'diphthong'], required: true },
  exampleWord: {
    word: { type: String },
    audioUrl: { type: String }
  },
  IPA_AudioUrl: { type: String }
});

module.exports = mongoose.model('Pronunciation', pronunciationSchema);
