const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
  },
  answers: [Number], // Array of answer indices
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  timeTaken: Number, // in seconds
  attemptedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

// Index for faster queries
quizAttemptSchema.index({ student: 1, quiz: 1 });
quizAttemptSchema.index({ student: 1, course: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
