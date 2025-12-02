const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);

module.exports = router;
