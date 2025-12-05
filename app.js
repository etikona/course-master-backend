const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const sanitize = require("mongo-sanitize");
const errorHandler = require("./src/middlewares/errorHandler.js");
const PORT = process.env.PORT || 5000;
const connectDB = require("./src/config/db.js");
const dotenv = require("dotenv");
const adminRouter = require("./src/routes/admin.js");
const authRouter = require("./src/routes/auth.js");
const courseRouter = require("./src/routes/courses.js");
const studentRouter = require("./src/routes/students.js");

const app = express();

// Connect to database
dotenv.config();
connectDB();

// Middleware
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/courses", courseRouter);
app.use("/api/students", studentRouter);
app.use("/api/admin", adminRouter);

// Home route
app.get("/", (req, res) => {
  res.json({ message: "CourseMaster API" });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
