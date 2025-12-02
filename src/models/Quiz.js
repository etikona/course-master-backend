const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: Number,
      points: {
        type: Number,
        default: 1,
      },
    },
  ],
  totalPoints: Number,
  passingScore: {
    type: Number,
    default: 70,
  },
  timeLimit: Number,
});

module.exports = mongoose.model("Quiz", quizSchema);
