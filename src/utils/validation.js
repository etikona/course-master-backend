const Joi = require("joi");

const authValidation = {
  register: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("student", "instructor"),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const courseValidation = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).required(),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
    price: Joi.number().min(0).required(),
    thumbnail: Joi.string().uri(),
    syllabus: Joi.array().items(
      Joi.object({
        week: Joi.number().required(),
        topic: Joi.string().required(),
        description: Joi.string().required(),
      })
    ),
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200),
    description: Joi.string().min(10),
    category: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    price: Joi.number().min(0),
    thumbnail: Joi.string().uri(),
    isPublished: Joi.boolean(),
  }),
};

const quizValidation = {
  create: Joi.object({
    moduleId: Joi.string().required(),
    title: Joi.string().min(5).max(200).required(),
    questions: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          options: Joi.array().items(Joi.string()).min(2).required(),
          correctAnswer: Joi.number().min(0).required(),
          points: Joi.number().min(1).default(1),
        })
      )
      .min(1)
      .required(),
    passingScore: Joi.number().min(0).max(100).default(70),
    timeLimit: Joi.number().min(1).max(180).default(30), // minutes
  }),

  submit: Joi.object({
    answers: Joi.array().items(Joi.number()).required(),
    timeTaken: Joi.number().min(0), // seconds
  }),
};

const assignmentValidation = {
  submit: Joi.object({
    courseId: Joi.string().required(),
    moduleId: Joi.string().required(),
    submission: Joi.string().required(),
    submissionType: Joi.string().valid("text", "link", "file").default("text"),
  }),

  review: Joi.object({
    grade: Joi.number().min(0).max(100).required(),
    feedback: Joi.string().max(1000),
  }),
};

module.exports = {
  authValidation,
  courseValidation,
  quizValidation,
  assignmentValidation,
};
