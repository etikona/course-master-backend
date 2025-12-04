require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

// Models
const User = require("../models/User");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");
const Enrollment = require("../models/Enrollment");

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Quiz.deleteMany({});
    await Enrollment.deleteMany({});

    console.log("Cleared existing data...");

    // 1. Create Users
    const admin = await User.create({
      name: "System Administrator",
      email: "admin@coursemaster.com",
      password: "Admin123!",
      role: "admin",
      avatar:
        "https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff",
    });

    const instructor1 = await User.create({
      name: "Dr. Sarah Johnson",
      email: "sarah@example.com",
      password: "Instructor123!",
      role: "instructor",
      bio: "PhD in Computer Science with 10+ years of teaching experience",
      avatar:
        "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff",
    });

    const instructor2 = await User.create({
      name: "Prof. Michael Chen",
      email: "michael@example.com",
      password: "Instructor123!",
      role: "instructor",
      bio: "Full Stack Developer and DevOps Expert",
      avatar:
        "https://ui-avatars.com/api/?name=Michael+Chen&background=0EA5E9&color=fff",
    });

    const students = await User.create([
      {
        name: "John Doe",
        email: "john@example.com",
        password: "Student123!",
        role: "student",
        avatar:
          "https://ui-avatars.com/api/?name=John+Doe&background=6366F1&color=fff",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "Student123!",
        role: "student",
        avatar:
          "https://ui-avatars.com/api/?name=Jane+Smith&background=8B5CF6&color=fff",
      },
      {
        name: "Alex Wilson",
        email: "alex@example.com",
        password: "Student123!",
        role: "student",
        avatar:
          "https://ui-avatars.com/api/?name=Alex+Wilson&background=F59E0B&color=fff",
      },
    ]);

    console.log("Created users...");

    // 2. Create Courses
    const webDevCourse = await Course.create({
      title: "Complete Web Development Bootcamp 2024",
      description:
        "Learn HTML, CSS, JavaScript, React, Node.js, MongoDB and more! Build real projects.",
      instructor: instructor1._id,
      category: "Web Development",
      tags: ["javascript", "react", "nodejs", "mongodb", "fullstack"],
      price: 299,
      thumbnail:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=300&fit=crop",
      syllabus: [
        {
          week: 1,
          topic: "HTML & CSS Fundamentals",
          description: "Learn the building blocks of web development",
        },
        {
          week: 2,
          topic: "JavaScript Basics",
          description: "Master JavaScript fundamentals and DOM manipulation",
        },
        {
          week: 3,
          topic: "Advanced JavaScript",
          description: "ES6+, Async Programming, APIs",
        },
        {
          week: 4,
          topic: "React Fundamentals",
          description: "Components, State, Props, Hooks",
        },
      ],
      batches: [
        {
          name: "Batch 2024-01",
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-04-15"),
          maxStudents: 100,
        },
        {
          name: "Batch 2024-02",
          startDate: new Date("2024-02-01"),
          endDate: new Date("2024-05-01"),
          maxStudents: 150,
        },
      ],
      rating: 4.8,
      totalStudents: 1500,
      isPublished: true,
    });

    const dataScienceCourse = await Course.create({
      title: "Data Science & Machine Learning Masterclass",
      description:
        "Master Python, Pandas, NumPy, Scikit-learn, TensorFlow and build ML models",
      instructor: instructor2._id,
      category: "Data Science",
      tags: ["python", "machine-learning", "data-analysis", "deep-learning"],
      price: 399,
      thumbnail:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500&h=300&fit=crop",
      syllabus: [
        {
          week: 1,
          topic: "Python for Data Science",
          description: "NumPy, Pandas, Matplotlib",
        },
        {
          week: 2,
          topic: "Data Analysis & Visualization",
          description: "Exploratory Data Analysis, Seaborn",
        },
        {
          week: 3,
          topic: "Machine Learning Fundamentals",
          description: "Regression, Classification, Clustering",
        },
        {
          week: 4,
          topic: "Deep Learning",
          description: "Neural Networks, TensorFlow, Keras",
        },
      ],
      batches: [
        {
          name: "DS Batch 2024-01",
          startDate: new Date("2024-01-20"),
          endDate: new Date("2024-05-20"),
          maxStudents: 80,
        },
      ],
      rating: 4.9,
      totalStudents: 890,
      isPublished: true,
    });

    const mobileDevCourse = await Course.create({
      title: "React Native Mobile App Development",
      description:
        "Build cross-platform mobile apps for iOS and Android using React Native",
      instructor: instructor1._id,
      category: "Mobile Development",
      tags: ["react-native", "mobile", "ios", "android", "javascript"],
      price: 249,
      thumbnail:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=300&fit=crop",
      isPublished: true,
    });

    console.log("Created courses...");

    // 3. Create Modules for Web Development Course
    const module1 = await Module.create({
      title: "HTML & CSS Fundamentals",
      description: "Learn the building blocks of web development",
      course: webDevCourse._id,
      order: 1,
    });

    const module2 = await Module.create({
      title: "JavaScript Basics",
      description: "Master JavaScript fundamentals",
      course: webDevCourse._id,
      order: 2,
    });

    const module3 = await Module.create({
      title: "Advanced JavaScript",
      description: "ES6+, Async Programming, APIs",
      course: webDevCourse._id,
      order: 3,
    });

    // 4. Create Lessons for Module 1
    const lesson1 = await Lesson.create({
      title: "Introduction to HTML",
      description: "Learn HTML structure and basic tags",
      module: module1._id,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 45,
      order: 1,
      isPreview: true,
      resources: [
        {
          title: "HTML Cheat Sheet",
          url: "https://example.com/html-cheatsheet.pdf",
          type: "pdf",
        },
      ],
    });

    const lesson2 = await Lesson.create({
      title: "CSS Selectors and Properties",
      description: "Master CSS selectors and common properties",
      module: module1._id,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 60,
      order: 2,
    });

    const lesson3 = await Lesson.create({
      title: "Flexbox Layout",
      description: "Modern layout techniques with Flexbox",
      module: module1._id,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 55,
      order: 3,
    });

    // Update modules with lessons
    module1.lessons = [lesson1._id, lesson2._id, lesson3._id];
    await module1.save();

    // 5. Create Quiz for Module 1
    const quiz1 = await Quiz.create({
      title: "HTML & CSS Assessment",
      module: module1._id,
      questions: [
        {
          question: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Hyper Transfer Markup Language",
            "Home Tool Markup Language",
          ],
          correctAnswer: 0,
          points: 1,
        },
        {
          question: "Which CSS property controls text size?",
          options: ["font-style", "text-size", "font-size", "text-style"],
          correctAnswer: 2,
          points: 1,
        },
        {
          question: "Which tag is used for the largest heading?",
          options: ["<h6>", "<heading>", "<h1>", "<head>"],
          correctAnswer: 2,
          points: 1,
        },
      ],
      totalPoints: 3,
      passingScore: 70,
      timeLimit: 10,
    });

    // Update module with quiz
    module1.quiz = quiz1._id;
    await module1.save();

    // 6. Update courses with modules
    webDevCourse.modules = [module1._id, module2._id, module3._id];
    await webDevCourse.save();

    // 7. Create Enrollments
    const enrollment1 = await Enrollment.create({
      student: students[0]._id,
      course: webDevCourse._id,
      batch: "Batch 2024-01",
      progress: 33,
      completedLessons: [lesson1._id],
      enrolledAt: new Date("2024-01-16"),
    });

    const enrollment2 = await Enrollment.create({
      student: students[1]._id,
      course: dataScienceCourse._id,
      batch: "DS Batch 2024-01",
      progress: 50,
      enrolledAt: new Date("2024-01-21"),
    });

    // 8. Update users with enrolled courses
    await User.findByIdAndUpdate(students[0]._id, {
      $push: {
        enrolledCourses: {
          course: webDevCourse._id,
          progress: 33,
          completedLessons: [lesson1._id],
          batch: "Batch 2024-01",
        },
      },
    });

    console.log("Database seeded successfully!");
    console.log("\n=== Login Credentials ===");
    console.log("Admin:");
    console.log("Email: admin@coursemaster.com");
    console.log("Password: Admin123!");
    console.log("\nStudent:");
    console.log("Email: john@example.com");
    console.log("Password: Student123!");
    console.log("\nInstructor:");
    console.log("Email: sarah@example.com");
    console.log("Password: Instructor123!");
    console.log("\n========================");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
