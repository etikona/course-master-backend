const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  lessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
  ],
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
  },
  assignment: {
    title: String,
    description: String,
    dueDate: Date,
  },
});

module.exports = mongoose.model("Module", moduleSchema);
