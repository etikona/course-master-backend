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
const adminAuth = require("../middlewares/adminAuth");

const courseRouter = router;

// Public routes
courseRouter.get("/", getCourses);
courseRouter.get("/:id", getCourse);

// Protected routes
courseRouter.post("/:id/enroll", auth, enrollCourse);
courseRouter.get("/:id/progress", auth, getCourseProgress);
courseRouter.post("/:id/lessons/:lessonId/complete", auth, markLessonComplete);

// Admin routes
courseRouter.post("/", adminAuth, createCourse);
courseRouter.put("/:id", adminAuth, updateCourse);
courseRouter.delete("/:id", adminAuth, deleteCourse);

module.exports = courseRouter;
