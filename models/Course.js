const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    iconUrl: String,
    order: { type: Number, default: 0 },
    isUnlock: { type: Boolean, default: false }
});

module.exports = mongoose.model("Course", courseSchema);