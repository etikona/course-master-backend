const express = require("express");
const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
const errorHandler = require("./src/middlewares/errorHandler.js");
const PORT = process.env.PORT || 5000;
const connectDB = require("./src/config/db.js");
const dotenv = require("dotenv");

const app = express();

// Connect to database
dotenv.config();
connectDB();

// Middleware
// app.use(helmet());
app.use(cors());
app.use(express.json());
// app.use(morgan("dev"));

// Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/courses", require("./src/routes/courses"));
app.use("/api/students", require("./src/routes/students"));
app.use("/api/admin", require("./src/routes/admin"));

// Home route
app.get("/", (req, res) => {
  res.json({ message: "CourseMaster API" });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
