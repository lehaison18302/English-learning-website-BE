const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
const Lesson = require('../models/Lesson');
const Vocabulary = require('../models/Vocabulary');
require('dotenv').config();

// Kết nối đến MongoDB
const connectDB = async () => {
    try {
        const queryString = process.env.MONGODB_URI || "mongodb+srv://nttquyen041220:Nttq@learn-eng-cluster.qc2hm.mongodb.net/Learning-English-Web";
        await mongoose.connect(queryString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Hàm cập nhật exercises
const updateExercises = async () => {
    try {
        // Lấy tất cả lessons
        const lessons = await Lesson.find().sort({ title: 1 });
        console.log(`Found ${lessons.length} lessons`);

        for (const lesson of lessons) {
            console.log(`\nProcessing lesson: ${lesson.title} (${lesson._id})`);

            // Lấy vocabulary của lesson
            const vocabularies = await Vocabulary.find({ lessonID: lesson._id });
            console.log(`Found ${vocabularies.length} vocabularies for this lesson`);

            if (vocabularies.length === 0) {
                console.log('No vocabularies found for this lesson, skipping...');
                continue;
            }

            // Lấy exercises của lesson từ mảng exercises trong lesson
            const lessonExercises = await Exercise.find({
                _id: { $in: lesson.exercises }
            });

            console.log(`Found ${lessonExercises.length} exercises for this lesson`);

            // Cập nhật từng exercise
            for (const exercise of lessonExercises) {
                // Cập nhật các trường bắt buộc
                exercise.skillID = lesson.skillID;
                exercise.lessonID = lesson._id;

                // Gán vocabularyIDs ngẫu nhiên cho exercise
                // Mỗi exercise sẽ có 1-2 vocabularies
                const numVocabs = Math.floor(Math.random() * 2) + 1; // 1 hoặc 2
                const shuffledVocabs = vocabularies.sort(() => 0.5 - Math.random());
                exercise.vocabularyIDs = shuffledVocabs.slice(0, numVocabs).map(v => v._id);

                await exercise.save();
                console.log(`Updated exercise ${exercise._id} with ${exercise.vocabularyIDs.length} vocabularies`);
            }
        }

        console.log('\nAll exercises have been updated successfully!');
    } catch (error) {
        console.error('Error updating exercises:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Chạy script
(async () => {
    await connectDB();
    await updateExercises();
})(); 