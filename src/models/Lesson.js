const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  videoUrl: String,
  duration: Number,
  order: {
    type: Number,
    required: true,
  },
  isPreview: {
    type: Boolean,
    default: false,
  },
  resources: [
    {
      title: String,
      url: String,
      type: String,
    },
  ],
});

module.exports = mongoose.model("Lesson", lessonSchema);
