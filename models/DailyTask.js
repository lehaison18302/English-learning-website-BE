const mongoose = require("mongoose");

const dailyTaskSchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  type: {
    type: String,
    enum: ["learn", "review", "streak"],
    required: true,
  },
  target: { type: Number, required: true }, 
  xpReward: { type: Number, required: true }, 
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("DailyTask", dailyTaskSchema);