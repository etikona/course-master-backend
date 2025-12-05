const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuiz,
  submitQuiz,
  getQuizResults,
  updateQuiz,
  deleteQuiz,
  getCourseQuizAttempts,
  getStudentQuizAttempts,
} = require("../controllers/quizController");
const { auth } = require("../middleware/auth");
const { adminAuth } = require("../middleware/adminAuth");

// Public routes
// None - quizzes require authentication

// Student routes
router.get("/:quizId", auth, getQuiz);
router.post("/:quizId/submit", auth, submitQuiz);
router.get("/:quizId/results", auth, getQuizResults);
router.get("/course/:courseId/attempts", auth, getStudentQuizAttempts);

// Admin/Instructor routes
router.post("/", adminAuth, createQuiz);
router.put("/:quizId", adminAuth, updateQuiz);
router.delete("/:quizId", adminAuth, deleteQuiz);
router.get(
  "/admin/course/:courseId/attempts",
  adminAuth,
  getCourseQuizAttempts
);

module.exports = router;
