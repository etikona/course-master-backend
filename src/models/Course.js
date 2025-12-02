const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  tags: [
    {
      type: String,
      index: true,
    },
  ],
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  thumbnail: String,
  syllabus: [
    {
      week: Number,
      topic: String,
      description: String,
    },
  ],
  modules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
    },
  ],
  batches: [
    {
      name: String,
      startDate: Date,
      endDate: Date,
      maxStudents: Number,
    },
  ],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", courseSchema);
