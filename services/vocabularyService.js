// vocabularyService.js
const Vocabulary = require('../models/Vocabulary');
const axios = require('axios');

const vocabularyService = {
    async createVocabulary(word, lessonID, skillID, courseID) {
        // Kiểm tra từ đã tồn tại
        const existing = await Vocabulary.findOne({ word, lessonID, skillID, courseID });
        if (existing) return existing;

        // Gọi API từ điển
        const wordData = await vocabularyService.fetchWordData(word);
        if (!wordData) throw new Error('Dictionary API failed');

        return Vocabulary.create({
        word,
        pronunciation: wordData.pronunciation,
        audioUrl: wordData.audio,
        meaning: wordData.meanings[0]?.definitions[0]?.definition || 'No definition',
        lessonID,
        skillID,
        courseID
        });
    },

    async getVocabulariesByLesson(lessonId) {
        return Vocabulary.find({ lessonID: lessonId })
        .populate('skillID', 'title')
        .populate('courseID', 'title');
    },

    async fetchWordData(word) {
        try {
        const response = await axios.get(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
        );
        
        if (!response.data?.length) return null;
        
        const wordData = response.data[0];
        return {
            pronunciation: wordData.phonetic || "",
            audio: wordData.phonetics.find(p => p.audio)?.audio || "",
            meanings: wordData.meanings || []
        };
        } catch (error) {
        console.error('Dictionary API Error:', error);
        return null;
        }
    }
};

module.exports = vocabularyService;