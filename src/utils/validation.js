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

module.exports = { authValidation, courseValidation };
