const Vocabulary = require('../models/Vocabulary');
const axios = require('axios');
require('dotenv').config();

const RAPIDAPI_KEY = '5bfc8068aamsh1dda549bcf87e2bp1e2bc4jsnfeca0c0384db';

const vocabularyService = {
    async createVocabulary(word, lessonID, skillID, courseID) {
        const existing = await Vocabulary.findOne({ word, lessonID, skillID, courseID });
        if (existing) return existing;

        const wordData = await vocabularyService.fetchWordData(word);
        if (!wordData) throw new Error('Dictionary API failed');

        return Vocabulary.create({
            word,
            pronunciation: wordData.pronunciation,
            audioUrl: wordData.audioUrl,
            meaning: wordData.meaning || `Nghĩa của ${word}`,
            examples: wordData.examples || [],
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

    async translateToVietnamese(text) {
        if (!RAPIDAPI_KEY) {
            console.error('RAPIDAPI_KEY is missing in environment variables');
            return text;
        }

        try {
            const options = {
                method: 'POST',
                url: 'https://google-api31.p.rapidapi.com/gtranslate',
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Host': 'google-api31.p.rapidapi.com',
                    'X-RapidAPI-Key': '5bfc8068aamsh1dda549bcf87e2bp1e2bc4jsnfeca0c0384db',
                },
                data: {
                    text: text,
                    to: 'vi',
                    from_lang: 'en'
                }
            };

            const response = await axios.request(options);
            return response.data.translated_text;
        } catch (error) {
            console.error('Google API31 Translation Error:', error.response?.data || error.message);
            return text;
        }
    },

    // Hàm lấy dữ liệu từ vựng
    async fetchWordData(word) {
        try {
            const vietnameseMeaning = await this.translateToVietnamese(word);

            let pronunciation = "";
            let audioUrl = "";
            let examples = [];
            
            try {
                const response = await axios.get(
                    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
                );
                
                if (response.data?.length) {
                    const wordData = response.data[0];
                    const phoneticEntry = wordData.phonetics?.find(p => p.text) || {};
                    
                    pronunciation = phoneticEntry.text || "";
                    audioUrl = phoneticEntry.audio || "";
                    
                    if (wordData.meanings?.[0]?.definitions?.[0]?.example) {
                        examples = [wordData.meanings[0].definitions[0].example];
                    }
                }
            } catch (pronunciationError) {
                console.log(`Pronunciation API error for "${word}": ${pronunciationError.message}`);
            }

            return {
                pronunciation,
                audioUrl,
                meaning: vietnameseMeaning,
                examples
            };
        } catch (error) {
            console.error(`Error for word "${word}":`, error.message);
            return null;
        }
    }
};

module.exports = vocabularyService;