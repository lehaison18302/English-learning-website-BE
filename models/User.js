const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    xp: { type: Number, default: 0 },
    streak: {
        current: { type: Number, default: 0 },
        lastActive: Date,
    },
    unlockedSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    completedLessons: [
        {
            lessonID: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
            score: Number,
            completedAt: Date,
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);