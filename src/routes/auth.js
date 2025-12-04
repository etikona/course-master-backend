const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

const authRouter = router;

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", auth, logout);
authRouter.get("/me", auth, getMe);

module.exports = authRouter;
