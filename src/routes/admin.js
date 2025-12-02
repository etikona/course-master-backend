const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllCourses,
  getAllStudents,
  getCourseEnrollments,
  getStudentEnrollments,
  updateStudent,
  deleteStudent,
  getAssignments,
  reviewAssignment,
  createBatch,
  updateBatch,
  deleteBatch,
  getAnalytics,
} = require("../controllers/adminController");
const { adminAuth } = require("../middlewares/adminAuth");

router.get("/dashboard", adminAuth, getDashboardStats);

router.get("/courses", adminAuth, getAllCourses);

router.get("/students", adminAuth, getAllStudents);
router.get("/students/:id/enrollments", adminAuth, getStudentEnrollments);
router.put("/students/:id", adminAuth, updateStudent);
router.delete("/students/:id", adminAuth, deleteStudent);

router.get("/courses/:courseId/enrollments", adminAuth, getCourseEnrollments);

router.get("/assignments", adminAuth, getAssignments);
router.put("/assignments/:id/review", adminAuth, reviewAssignment);

router.post("/courses/:courseId/batches", adminAuth, createBatch);
router.put("/batches/:id", adminAuth, updateBatch);
router.delete("/batches/:id", adminAuth, deleteBatch);

router.get("/analytics", adminAuth, getAnalytics);

module.exports = router;
