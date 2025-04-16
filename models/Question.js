const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    text: { 
        type: String,
        required: true
    },
    options: [ 
        {
            type: String,
            required: true
        }
    ],
    correctAnswer: { 
        type: String,
        required: true
    },
    lessonID: { 
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    xpReward: { 
        type: Number,
        default: 10
    }
}, { timestamps: true });


const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
