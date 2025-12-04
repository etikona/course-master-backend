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
const adminAuth = require("../middlewares/adminAuth");

const adminRouter = router;

adminRouter.get("/dashboard", adminAuth, getDashboardStats);

adminRouter.get("/courses", adminAuth, getAllCourses);

adminRouter.get("/students", adminAuth, getAllStudents);
adminRouter.get("/students/:id/enrollments", adminAuth, getStudentEnrollments);
adminRouter.put("/students/:id", adminAuth, updateStudent);
adminRouter.delete("/students/:id", adminAuth, deleteStudent);

adminRouter.get(
  "/courses/:courseId/enrollments",
  adminAuth,
  getCourseEnrollments
);

adminRouter.get("/assignments", adminAuth, getAssignments);
adminRouter.put("/assignments/:id/review", adminAuth, reviewAssignment);

adminRouter.post("/courses/:courseId/batches", adminAuth, createBatch);
adminRouter.put("/batches/:id", adminAuth, updateBatch);
adminRouter.delete("/batches/:id", adminAuth, deleteBatch);

adminRouter.get("/analytics", adminAuth, getAnalytics);

module.exports = adminRouter;
