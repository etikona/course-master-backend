const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Module = require("../models/Module");
const Quiz = require("../models/Quiz");
const Assignment = require("../models/Assignment");
const User = require("../models/User");

// Get student dashboard
exports.getDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get enrollments with progress
    const enrollments = await Enrollment.find({ student: studentId })
      .populate("course", "title thumbnail instructor category")
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "name",
        },
      })
      .sort({ enrolledAt: -1 })
      .limit(5);

    // Get stats
    const totalCourses = await Enrollment.countDocuments({
      student: studentId,
    });
    const completedCourses = await Enrollment.countDocuments({
      student: studentId,
      progress: 100,
    });
    const inProgressCourses = await Enrollment.countDocuments({
      student: studentId,
      progress: { $gt: 0, $lt: 100 },
    });

    // Get upcoming assignments
    const assignments = await Assignment.find({
      student: studentId,
      submitted: false,
      dueDate: { $gt: new Date() },
    })
      .populate("module", "title")
      .populate("course", "title")
      .sort({ dueDate: 1 })
      .limit(5);

    // Get recent activity
    const recentActivity = await Enrollment.aggregate([
      { $match: { student: studentId } },
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
        $project: {
          courseId: "$course._id",
          courseTitle: "$course.title",
          progress: 1,
          enrolledAt: 1,
          lastAccessed: 1,
        },
      },
      { $sort: { lastAccessed: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        enrollments,
        stats: {
          totalCourses,
          completedCourses,
          inProgressCourses,
        },
        assignments,
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get enrolled courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { student: req.user._id };

    if (status === "completed") {
      query.progress = 100;
    } else if (status === "in-progress") {
      query.progress = { $gt: 0, $lt: 100 };
    } else if (status === "not-started") {
      query.progress = 0;
    }

    const enrollments = await Enrollment.find(query)
      .populate(
        "course",
        "title thumbnail instructor category rating totalStudents"
      )
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

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      data: enrollments,
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

// Get course details for enrolled student
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // Get course with modules and lessons
    const course = await Course.findById(courseId)
      .populate("instructor", "name email bio avatar")
      .populate({
        path: "modules",
        populate: {
          path: "lessons",
          select:
            "title description duration order videoUrl isPreview resources",
        },
      })
      .populate({
        path: "modules",
        populate: {
          path: "quiz",
          select: "title questions timeLimit",
        },
      });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Mark completed lessons
    const modulesWithProgress = course.modules.map((module) => {
      const moduleLessons = module.lessons || [];
      const completedLessons = moduleLessons.filter((lesson) =>
        enrollment.completedLessons.includes(lesson._id)
      );

      return {
        ...module.toObject(),
        progress:
          moduleLessons.length > 0
            ? (completedLessons.length / moduleLessons.length) * 100
            : 0,
        completedLessons: completedLessons.length,
        totalLessons: moduleLessons.length,
      };
    });

    // Get assignments for this course
    const assignments = await Assignment.find({
      student: studentId,
      course: courseId,
    })
      .populate("module", "title")
      .sort({ createdAt: -1 });

    // Get quiz attempts for this course
    const quizAttempts = await QuizAttempt.find({
      student: studentId,
      quiz: {
        $in: course.modules.filter((m) => m.quiz).map((m) => m.quiz._id),
      },
    })
      .populate("quiz", "title")
      .sort({ attemptedAt: -1 });

    res.json({
      success: true,
      data: {
        course: {
          ...course.toObject(),
          modules: modulesWithProgress,
        },
        enrollment,
        assignments,
        quizAttempts,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get lesson details
exports.getLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user._id;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // Get lesson
    const lesson = await Lesson.findById(lessonId).populate("module", "title");

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // Get next and previous lessons
    const module = await Module.findById(lesson.module).populate(
      "lessons",
      "title order"
    );

    const lessons = module.lessons.sort((a, b) => a.order - b.order);
    const currentIndex = lessons.findIndex(
      (l) => l._id.toString() === lessonId
    );

    const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
    const nextLesson =
      currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

    // Check if lesson is completed
    const isCompleted = enrollment.completedLessons.includes(lessonId);

    res.json({
      success: true,
      data: {
        lesson,
        previousLesson,
        nextLesson,
        isCompleted,
        module: module.title,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit assignment
exports.submitAssignment = async (req, res) => {
  try {
    const {
      courseId,
      moduleId,
      submission,
      submissionType = "text",
    } = req.body;
    const studentId = req.user._id;

    // Validate submission
    if (!submission || submission.trim() === "") {
      return res.status(400).json({ error: "Submission is required" });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // Check if assignment already submitted
    const existingAssignment = await Assignment.findOne({
      student: studentId,
      course: courseId,
      module: moduleId,
    });

    if (existingAssignment) {
      // Update existing submission
      existingAssignment.submission = submission;
      existingAssignment.submissionType = submissionType;
      existingAssignment.submittedAt = new Date();
      existingAssignment.resubmitted = true;
      await existingAssignment.save();

      return res.json({
        success: true,
        message: "Assignment resubmitted successfully",
        data: existingAssignment,
      });
    }

    // Create new assignment submission
    const assignment = await Assignment.create({
      student: studentId,
      course: courseId,
      module: moduleId,
      submission,
      submissionType,
      submitted: true,
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Assignment submitted successfully",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Take quiz
exports.takeQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of answer indices
    const studentId = req.user._id;

    // Get quiz
    const quiz = await Quiz.findById(quizId).populate("module", "title course");

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: quiz.module.course,
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // Check if already attempted (optional: allow retakes)
    const existingAttempt = await QuizAttempt.findOne({
      student: studentId,
      quiz: quizId,
    });

    if (existingAttempt && !quiz.allowRetake) {
      return res.status(400).json({ error: "Quiz already attempted" });
    }

    // Calculate score
    let score = 0;
    const results = quiz.questions.map((question, index) => {
      const isCorrect = answers[index] === question.correctAnswer;
      if (isCorrect) score += question.points;

      return {
        question: question.question,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
      };
    });

    const totalScore = (score / quiz.totalPoints) * 100;
    const passed = totalScore >= quiz.passingScore;

    // Save attempt
    const quizAttempt = await QuizAttempt.create({
      student: studentId,
      quiz: quizId,
      course: quiz.module.course,
      module: quiz.module._id,
      answers,
      score: totalScore,
      passed,
      attemptedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        attempt: quizAttempt,
        results,
        summary: {
          score: totalScore.toFixed(2),
          passed,
          correctAnswers: score,
          totalQuestions: quiz.questions.length,
          passingScore: quiz.passingScore,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get quiz results
exports.getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id;

    const attempts = await QuizAttempt.find({
      student: studentId,
      quiz: quizId,
    }).sort({ attemptedAt: -1 });

    if (attempts.length === 0) {
      return res.status(404).json({ error: "No attempts found for this quiz" });
    }

    // Get quiz details
    const quiz = await Quiz.findById(quizId).select(
      "title questions passingScore totalPoints"
    );

    res.json({
      success: true,
      data: {
        quiz,
        attempts,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update student profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, bio, phone } = req.body;
    const studentId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (bio) updateData.bio = bio;
    if (phone) updateData.phone = phone;

    const student = await User.findByIdAndUpdate(studentId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get course progress
exports.getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    }).populate("completedLessons", "title module");

    if (!enrollment) {
      return res.status(404).json({ error: "Not enrolled in this course" });
    }

    // Get course modules and lessons
    const course = await Course.findById(courseId).populate({
      path: "modules",
      populate: {
        path: "lessons",
        select: "title order",
      },
    });

    // Calculate detailed progress
    const moduleProgress = course.modules.map((module) => {
      const totalLessons = module.lessons.length;
      const completedLessons = module.lessons.filter((lesson) =>
        enrollment.completedLessons.some(
          (cl) => cl._id.toString() === lesson._id.toString()
        )
      ).length;

      return {
        moduleId: module._id,
        moduleTitle: module.title,
        completedLessons,
        totalLessons,
        progress:
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
      };
    });

    // Get upcoming assignments
    const assignments = await Assignment.find({
      student: studentId,
      course: courseId,
      submitted: false,
      dueDate: { $gt: new Date() },
    })
      .populate("module", "title")
      .sort({ dueDate: 1 });

    // Get quiz attempts
    const quizAttempts = await QuizAttempt.find({
      student: studentId,
      course: courseId,
    })
      .populate("quiz", "title")
      .sort({ attemptedAt: -1 });

    res.json({
      success: true,
      data: {
        overallProgress: enrollment.progress,
        moduleProgress,
        completedLessons: enrollment.completedLessons.length,
        totalLessons: course.modules.reduce(
          (total, module) => total + module.lessons.length,
          0
        ),
        assignments,
        quizAttempts,
        enrolledAt: enrollment.enrolledAt,
        lastAccessed: enrollment.lastAccessed,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
