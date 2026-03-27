const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  question:     { type: String, required: true },
  options:      { type: [String], required: true },
  correctIndex: { type: Number, required: true },
})

const resultSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  options:       { type: [String], required: true },
  correctIndex:  { type: Number, required: true },
  selectedIndex: { type: Number, required: true },
  isCorrect:     { type: Boolean, required: true },
  explanation:   { type: String, default: '' },
})

const quizSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    field:     { type: String, required: true },
    topic:     { type: String, required: true },
    mode:      { type: String, enum: ['quiz', 'learn'], default: 'quiz' },
    questions: { type: [questionSchema], required: true },

    // Filled after submission
    resultId:  { type: String, default: null },
    score:     { type: Number, default: null },
    total:     { type: Number, default: null },
    results:   { type: [resultSchema], default: [] },
    submitted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Quiz', quizSchema)