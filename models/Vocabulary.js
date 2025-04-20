const mongoose = require('mongoose');

const VocabularySchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },       // Từ vựng
  meaning: { type: String, required: true },                  // Nghĩa
  example: { type: String },                                  // Câu ví dụ
  phonetic: { type: String },                                 // Phiên âm (optional)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Vocabulary', VocabularySchema);
