const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
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
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },

  // Student submission (either Google Drive link or text)
  driveLink: {
    type: String,
    default: null,
  },
  textAnswer: {
    type: String,
    default: null,
  },

  // Assignment submission status
  submitted: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
  },

  // Instructor review
  graded: {
    type: Boolean,
    default: false,
  },
  grade: {
    type: Number,
    min: 0,
    max: 100,
  },
  feedback: {
    type: String,
  },
  gradedAt: {
    type: Date,
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Indexes for performance
assignmentSchema.index({ student: 1, course: 1, module: 1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
