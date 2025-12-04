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
const studentRouter = router;
// Student dashboard
studentRouter.get("/dashboard", auth, getDashboard);

// Enrolled courses
studentRouter.get("/courses", auth, getEnrolledCourses);
studentRouter.get("/courses/:courseId", auth, getCourseDetails);
studentRouter.get("/courses/:courseId/lessons/:lessonId", auth, getLesson);
studentRouter.get("/courses/:courseId/progress", auth, getProgress);

// Assignments
studentRouter.post("/assignments", auth, submitAssignment);

// Quizzes
studentRouter.post("/quizzes/:quizId/submit", auth, takeQuiz);
studentRouter.get("/quizzes/:quizId/results", auth, getQuizResults);

// Profile
studentRouter.put("/profile", auth, updateProfile);

module.exports = studentRouter;
