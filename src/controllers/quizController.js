const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Module = require("../models/Module");

// Create quiz (Admin/Instructor)
exports.createQuiz = async (req, res) => {
  try {
    const { moduleId, title, questions, passingScore, timeLimit } = req.body;

    // Validate module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    // Check if user is instructor or admin of the course
    const course = await Course.findById(module.course);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (
      req.user.role !== "admin" &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to create quiz for this course" });
    }

    // Validate questions
    if (!questions || questions.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one question is required" });
    }

    // Calculate total points
    const totalPoints = questions.reduce(
      (sum, question) => sum + (question.points || 1),
      0
    );

    // Create quiz
    const quiz = await Quiz.create({
      title,
      module: moduleId,
      questions,
      totalPoints,
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 30, // minutes
    });

    // Update module with quiz reference
    module.quiz = quiz._id;
    await module.save();

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get quiz details
exports.getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("module", "title").lean();

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Get module and course to check enrollment
    const module = await Module.findById(quiz.module).populate("course");
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: module.course._id,
    });

    if (!enrollment && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // If not admin, don't send correct answers
    if (req.user.role !== "admin") {
      quiz.questions = quiz.questions.map((question) => ({
        question: question.question,
        options: question.options,
        points: question.points,
        // Don't include correctAnswer
      }));
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit quiz attempt
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTaken } = req.body;

    // Get quiz with correct answers
    const quiz = await Quiz.findById(quizId).populate({
      path: "module",
      populate: { path: "course" },
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.module.course._id,
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    // Validate answers array length
    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({
        error: `Expected ${quiz.questions.length} answers, got ${
          answers ? answers.length : 0
        }`,
      });
    }

    // Calculate score
    let score = 0;
    const results = quiz.questions.map((question, index) => {
      const isCorrect = answers[index] === question.correctAnswer;
      if (isCorrect) {
        score += question.points || 1;
      }

      return {
        question: question.question,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points || 1 : 0,
      };
    });

    const percentageScore = (score / quiz.totalPoints) * 100;
    const passed = percentageScore >= quiz.passingScore;

    // Check if already attempted (allow only one attempt per quiz)
    const existingAttempt = await QuizAttempt.findOne({
      student: req.user._id,
      quiz: quizId,
    });

    if (existingAttempt) {
      return res.status(400).json({
        error: "Quiz already attempted. Only one attempt allowed.",
      });
    }

    // Create quiz attempt
    const quizAttempt = await QuizAttempt.create({
      student: req.user._id,
      quiz: quizId,
      course: quiz.module.course._id,
      module: quiz.module._id,
      answers,
      score: percentageScore,
      passed,
      timeTaken: timeTaken || 0,
      attemptedAt: new Date(),
      completedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        attempt: quizAttempt,
        results,
        summary: {
          score: percentageScore.toFixed(2),
          passed,
          correctAnswers: score,
          totalQuestions: quiz.questions.length,
          totalPoints: quiz.totalPoints,
          passingScore: quiz.passingScore,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get quiz results for student
exports.getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("module", "title").lean();

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Get quiz attempts for this student
    const attempts = await QuizAttempt.find({
      student: req.user._id,
      quiz: quizId,
    })
      .sort({ attemptedAt: -1 })
      .lean();

    if (attempts.length === 0) {
      return res.status(404).json({ error: "No attempts found for this quiz" });
    }

    // Get latest attempt details with correct answers
    const latestAttempt = attempts[0];
    const quizWithAnswers = await Quiz.findById(quizId);

    const detailedResults = quizWithAnswers.questions.map(
      (question, index) => ({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: latestAttempt.answers[index],
        isCorrect: latestAttempt.answers[index] === question.correctAnswer,
      })
    );

    res.json({
      success: true,
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          passingScore: quiz.passingScore,
          timeLimit: quiz.timeLimit,
        },
        attempts,
        latestAttempt: {
          ...latestAttempt,
          detailedResults,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update quiz (Admin/Instructor)
exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Check authorization
    const module = await Module.findById(quiz.module).populate("course");
    if (
      req.user.role !== "admin" &&
      module.course.instructor.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this quiz" });
    }

    // If updating questions, recalculate totalPoints
    if (updates.questions) {
      updates.totalPoints = updates.questions.reduce(
        (sum, question) => sum + (question.points || 1),
        0
      );
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(quizId, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Quiz updated successfully",
      data: updatedQuiz,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete quiz (Admin/Instructor)
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Check authorization
    const module = await Module.findById(quiz.module).populate("course");
    if (
      req.user.role !== "admin" &&
      module.course.instructor.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this quiz" });
    }

    // Delete quiz attempts
    await QuizAttempt.deleteMany({ quiz: quizId });

    // Remove quiz reference from module
    module.quiz = undefined;
    await module.save();

    // Delete quiz
    await quiz.deleteOne();

    res.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quiz attempts for a course (Admin/Instructor)
exports.getCourseQuizAttempts = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20, studentId, moduleId } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is admin or instructor of the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (
      req.user.role !== "admin" &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({
          error: "Not authorized to view quiz attempts for this course",
        });
    }

    let query = { course: courseId };

    if (studentId) {
      query.student = studentId;
    }

    if (moduleId) {
      const module = await Module.findById(moduleId);
      if (module && module.quiz) {
        query.quiz = module.quiz;
      }
    }

    const attempts = await QuizAttempt.find(query)
      .populate("student", "name email")
      .populate("quiz", "title")
      .populate("module", "title")
      .sort({ attemptedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await QuizAttempt.countDocuments(query);

    // Calculate statistics
    const stats = await QuizAttempt.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$score" },
          passRate: {
            $avg: { $cond: [{ $eq: ["$passed", true] }, 1, 0] },
          },
          totalAttempts: { $sum: 1 },
          totalPassed: {
            $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        attempts,
        statistics: stats[0] || {
          averageScore: 0,
          passRate: 0,
          totalAttempts: 0,
          totalPassed: 0,
        },
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

// Get student's quiz attempts for a course
exports.getStudentQuizAttempts = async (req, res) => {
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

    const attempts = await QuizAttempt.find({
      student: studentId,
      course: courseId,
    })
      .populate("quiz", "title")
      .populate("module", "title")
      .sort({ attemptedAt: -1 });

    // Calculate overall performance
    const performance = attempts.reduce(
      (acc, attempt) => {
        acc.totalAttempts++;
        acc.totalScore += attempt.score;
        if (attempt.passed) acc.passed++;
        return acc;
      },
      { totalAttempts: 0, totalScore: 0, passed: 0 }
    );

    const averageScore =
      performance.totalAttempts > 0
        ? performance.totalScore / performance.totalAttempts
        : 0;

    res.json({
      success: true,
      data: {
        attempts,
        performance: {
          ...performance,
          averageScore: averageScore.toFixed(2),
          passRate:
            performance.totalAttempts > 0
              ? (
                  (performance.passed / performance.totalAttempts) *
                  100
                ).toFixed(2)
              : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
