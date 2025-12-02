const Course = require("../models/Course");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const { courseValidation } = require("../utils/validation");

// Get all courses with pagination, search, filter, sort
exports.getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder = "asc",
    } = req.query;

    // Build query
    let query = { isPublished: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "instructor.name": { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sort = {};
    if (sortBy === "price") {
      sort.price = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "rating") {
      sort.rating = sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const courses = await Course.find(query)
      .populate("instructor", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email bio")
      .populate({
        path: "modules",
        populate: {
          path: "lessons",
          select: "title description duration order isPreview",
        },
      });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { error } = courseValidation.create.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const course = await Course.create({
      ...req.body,
      instructor: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { error } = courseValidation.update.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await course.deleteOne();

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      batch: req.body.batch || "Default Batch",
    });

    // Update user's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        enrolledCourses: {
          course: course._id,
          batch: enrollment.batch,
        },
      },
    });

    // Update course total students
    course.totalStudents += 1;
    await course.save();

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.id,
    }).populate("completedLessons", "title module");

    if (!enrollment) {
      return res.status(404).json({ error: "Not enrolled in this course" });
    }

    // Calculate progress
    const course = await Course.findById(req.params.id).populate("modules");
    let totalLessons = 0;
    course.modules.forEach((module) => {
      totalLessons += module.lessons.length;
    });

    const progress =
      totalLessons > 0
        ? Math.round((enrollment.completedLessons.length / totalLessons) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        enrollment,
        progress,
        completedLessons: enrollment.completedLessons.length,
        totalLessons,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markLessonComplete = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.id,
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Not enrolled in this course" });
    }

    // Add lesson to completed if not already
    if (!enrollment.completedLessons.includes(req.params.lessonId)) {
      enrollment.completedLessons.push(req.params.lessonId);

      // Recalculate progress
      const course = await Course.findById(req.params.id).populate("modules");
      let totalLessons = 0;
      course.modules.forEach((module) => {
        totalLessons += module.lessons.length;
      });

      enrollment.progress =
        totalLessons > 0
          ? Math.round(
              (enrollment.completedLessons.length / totalLessons) * 100
            )
          : 0;

      await enrollment.save();
    }

    res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
