const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:      { type: String, required: true },
  socketId:  { type: String, default: null },
  answers:   { type: Map, of: Number, default: {} },  // { "0": 2, "1": 0, ... }
  score:     { type: Number, default: 0 },
  finished:  { type: Boolean, default: false },
  kicked:    { type: Boolean, default: false },
  joinedAt:  { type: Date, default: Date.now },
})

const questionSchema = new mongoose.Schema({
  question:     String,
  options:      [String],
  correctIndex: Number,
})

const roomSchema = new mongoose.Schema({
  code:            { type: String, required: true, unique: true, uppercase: true },
  teacher:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherSocketId: { type: String, default: null },
  status:          { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },

  // Quiz config
  field:           { type: String, default: '' },
  topic:           { type: String, default: '' },
  questionCount:   { type: Number, default: 10 },
  timePerQuestion: { type: Number, default: 30 },  // seconds
  questions:       { type: [questionSchema], default: [] },

  students:        { type: [studentSchema], default: [] },

  startedAt:       { type: Date, default: null },
  finishedAt:      { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('Room', roomSchema)