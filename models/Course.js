const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    iconUrl: String,
});

module.exports = mongoose.model("Course", courseSchema);