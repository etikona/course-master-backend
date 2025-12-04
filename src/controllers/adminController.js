const Course = require("../models/Course");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Assignment = require("../models/Assignment"); // fixed
const Quiz = require("../models/Quiz");

// console.log("Loading adminController...");
// console.log("Course:", Course);
// console.log("User:", User);
// console.log("Enrollment:", Enrollment);
// console.log("Assignment:", Assignment);
// console.log("Quiz:", Quiz);

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      recentEnrollments,
      activeCourses,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.aggregate([
        {
          $lookup: {
            from: "courses",
            localField: "course",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        {
          $group: {
            _id: null,
            total: { $sum: "$course.price" },
          },
        },
      ]),
      Enrollment.find()
        .populate("student", "name email")
        .populate("course", "title price")
        .sort({ enrolledAt: -1 })
        .limit(10),
      Course.find({ isPublished: true })
        .sort({ totalStudents: -1 })
        .limit(5)
        .select("title totalStudents rating"),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalEnrollments,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentEnrollments,
        activeCourses,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all courses (admin view)
exports.getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "published") {
      query.isPublished = true;
    } else if (status === "draft") {
      query.isPublished = false;
    }

    const courses = await Course.find(query)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Course.countDocuments(query);

    // Get enrollment counts for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.countDocuments({
          course: course._id,
        });
        const assignments = await Assignment.countDocuments({
          course: course._id,
          submitted: true,
        });

        return {
          ...course,
          totalEnrollments: enrollments,
          pendingAssignments: assignments,
        };
      })
    );

    res.json({
      success: true,
      data: coursesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: "student" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const students = await User.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get enrollment stats for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.countDocuments({
          student: student._id,
        });
        const completedCourses = await Enrollment.countDocuments({
          student: student._id,
          progress: 100,
        });

        return {
          ...student,
          totalEnrollments: enrollments,
          completedCourses,
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: studentsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get course enrollments
exports.getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { batch, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { course: courseId };

    if (batch) {
      query.batch = batch;
    }

    const enrollments = await Enrollment.find(query)
      .populate("student", "name email avatar")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments(query);

    // Get course details
    const course = await Course.findById(courseId).select("title batches");

    res.json({
      success: true,
      data: {
        enrollments,
        course,
        batches: course?.batches || [],
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get student enrollments
exports.getStudentEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find({ student: id })
      .populate("course", "title thumbnail instructor category")
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "name",
        },
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments({ student: id });

    // Get student info
    const student = await User.findById(id).select(
      "name email avatar createdAt"
    );

    res.json({
      success: true,
      data: {
        student,
        enrollments,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (status) updateData.status = status;

    const student = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Delete student's enrollments
    await Enrollment.deleteMany({ student: id });

    // Delete student
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Student and associated data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all assignments for review
exports.getAssignments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      courseId,
      status = "pending",
      studentId,
    } = req.query;

    const skip = (page - 1) * limit;

    let query = { submitted: true };

    if (courseId) {
      query.course = courseId;
    }

    if (studentId) {
      query.student = studentId;
    }

    if (status === "pending") {
      query.graded = false;
    } else if (status === "graded") {
      query.graded = true;
    }

    const assignments = await Assignment.find(query)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("module", "title")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Assignment.countDocuments(query);

    // Get course list for filter
    const courses = await Course.find().select("title _id");

    res.json({
      success: true,
      data: assignments,
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Review assignment
exports.reviewAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    if (!grade || grade < 0 || grade > 100) {
      return res.status(400).json({ error: "Grade must be between 0 and 100" });
    }

    const assignment = await Assignment.findByIdAndUpdate(
      id,
      {
        grade,
        feedback,
        graded: true,
        gradedAt: new Date(),
        gradedBy: req.user._id,
      },
      { new: true, runValidators: true }
    )
      .populate("student", "name email")
      .populate("course", "title")
      .populate("module", "title");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create batch for course
exports.createBatch = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, startDate, endDate, maxStudents } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if batch name already exists for this course
    const existingBatch = course.batches.find((batch) => batch.name === name);
    if (existingBatch) {
      return res.status(400).json({ error: "Batch name already exists" });
    }

    const newBatch = {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxStudents: maxStudents || 0,
    };

    course.batches.push(newBatch);
    await course.save();

    res.status(201).json({
      success: true,
      data: newBatch,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update batch
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find course containing this batch
    const course = await Course.findOne({ "batches._id": id });
    if (!course) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const batchIndex = course.batches.findIndex(
      (batch) => batch._id.toString() === id
    );

    // Update batch fields
    if (updates.name) course.batches[batchIndex].name = updates.name;
    if (updates.startDate)
      course.batches[batchIndex].startDate = new Date(updates.startDate);
    if (updates.endDate)
      course.batches[batchIndex].endDate = new Date(updates.endDate);
    if (updates.maxStudents !== undefined)
      course.batches[batchIndex].maxStudents = updates.maxStudents;

    await course.save();

    res.json({
      success: true,
      data: course.batches[batchIndex],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete batch
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({ "batches._id": id });
    if (!course) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Check if any students are enrolled in this batch
    const enrollments = await Enrollment.countDocuments({
      course: course._id,
      batch: course.batches.find((b) => b._id.toString() === id).name,
    });

    if (enrollments > 0) {
      return res.status(400).json({
        error: `Cannot delete batch with ${enrollments} enrolled students`,
      });
    }

    course.batches = course.batches.filter(
      (batch) => batch._id.toString() !== id
    );
    await course.save();

    res.json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const { timeframe = "month" } = req.query;
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Enrollment analytics
    const enrollmentAnalytics = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Revenue analytics
    const revenueAnalytics = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" },
          },
          revenue: { $sum: "$course.price" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Course popularity
    const popularCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: "$course",
          enrollments: { $sum: 1 },
        },
      },
      {
        $sort: { enrollments: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 0,
          courseId: "$course._id",
          title: "$course.title",
          enrollments: 1,
          rating: "$course.rating",
        },
      },
    ]);

    // Student completion rates
    const completionStats = await Enrollment.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ["$progress", 100] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        enrollmentAnalytics,
        revenueAnalytics,
        popularCourses,
        completionStats: completionStats[0] || {
          totalEnrollments: 0,
          completedEnrollments: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
