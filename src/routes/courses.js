const express = require("express");
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getCourseProgress,
  markLessonComplete,
} = require("../controllers/courseController");
const { auth } = require("../middlewares/auth");
const { adminAuth } = require("../middlewares/adminAuth");

// Public routes
router.get("/", getCourses);
router.get("/:id", getCourse);

// Protected routes
router.post("/:id/enroll", auth, enrollCourse);
router.get("/:id/progress", auth, getCourseProgress);
router.post("/:id/lessons/:lessonId/complete", auth, markLessonComplete);

// Admin routes
router.post("/", adminAuth, createCourse);
router.put("/:id", adminAuth, updateCourse);
router.delete("/:id", adminAuth, deleteCourse);

module.exports = router;
