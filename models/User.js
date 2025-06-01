const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    avatar: { type: String },
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
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);