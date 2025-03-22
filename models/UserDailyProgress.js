const mongoose = require("mongoose");

const userDailyProgressSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    tasks: [
        {
            taskID: { type: mongoose.Schema.Types.ObjectId, ref: "DailyTask" },
            progress: { type: Number, default: 0 },
            isCompleted: { type: Boolean, default: false },
        },
    ],
});

module.exports = mongoose.model("UserDailyProgress", userDailyProgressSchema);