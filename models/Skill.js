const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    title: { type: String, required: true },
    courseID: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    isUnlock: { type: Boolean, default: false },
    xpRequired: { type: Number, default: 0 },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    order: { type: Number, required: true },
    iconUrl: String,
});

module.exports = mongoose.model("Skill", skillSchema);