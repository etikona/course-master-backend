const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  batch: String,
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  completedLessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
  ],
  assignments: [
    {
      module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
      },
      submission: String,
      submittedAt: Date,
      grade: Number,
      feedback: String,
    },
  ],
  quizAttempts: [
    {
      quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
      score: Number,
      answers: [Number],
      attemptedAt: Date,
    },
  ],
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
