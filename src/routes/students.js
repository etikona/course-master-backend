const express = require("express");
const router = express.Router();
const {
  getDashboard,
  getEnrolledCourses,
  getCourseDetails,
  getLesson,
  submitAssignment,
  takeQuiz,
  getQuizResults,
  updateProfile,
  getProgress,
} = require("../controllers/studentController");
const { auth } = require("../middlewares/auth");

// Student dashboard
router.get("/dashboard", auth, getDashboard);

// Enrolled courses
router.get("/courses", auth, getEnrolledCourses);
router.get("/courses/:courseId", auth, getCourseDetails);
router.get("/courses/:courseId/lessons/:lessonId", auth, getLesson);
router.get("/courses/:courseId/progress", auth, getProgress);

// Assignments
router.post("/assignments", auth, submitAssignment);

// Quizzes
router.post("/quizzes/:quizId/submit", auth, takeQuiz);
router.get("/quizzes/:quizId/results", auth, getQuizResults);

// Profile
router.put("/profile", auth, updateProfile);

module.exports = router;
