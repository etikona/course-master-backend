const express = require("express");
const router = express.Router();
const {
  uploadSingle,
  uploadMultiple,
  serveFile,
} = require("../middleware/upload");
const { auth } = require("../middleware/auth");
const { adminAuth } = require("../middleware/adminAuth");

// Serve static files (public access)
router.get("/:folder?/:filename", serveFile);

// Upload profile picture (authenticated users)
router.post("/profile-picture", auth, uploadSingle("avatar"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Construct file URL
    const fileUrl = `${req.protocol}://${req.get("host")}/api/uploads/${
      req.file.filename
    }`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload course thumbnail (admin/instructor only)
router.post(
  "/course-thumbnail",
  adminAuth,
  uploadSingle("thumbnail"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/uploads/images/${req.file.filename}`;

      res.json({
        success: true,
        message: "Course thumbnail uploaded successfully",
        data: {
          filename: req.file.filename,
          url: fileUrl,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Upload assignment files (students only)
router.post("/assignment", auth, uploadMultiple("files", 3), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${req.protocol}://${req.get("host")}/api/uploads/documents/${
        file.filename
      }`,
    }));

    res.json({
      success: true,
      message: "Assignment files uploaded successfully",
      data: {
        files,
        count: files.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload lesson resources (admin/instructor only)
router.post(
  "/lesson-resources",
  adminAuth,
  uploadMultiple("resources", 5),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const resources = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `${req.protocol}://${req.get("host")}/api/uploads/documents/${
          file.filename
        }`,
        type: getFileType(file.mimetype),
      }));

      res.json({
        success: true,
        message: "Lesson resources uploaded successfully",
        data: {
          resources,
          count: resources.length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Helper function to determine file type
function getFileType(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("word") || mimetype.includes("document"))
    return "document";
  if (mimetype.includes("excel") || mimetype.includes("spreadsheet"))
    return "spreadsheet";
  if (mimetype === "text/plain") return "text";
  if (mimetype.includes("zip") || mimetype.includes("rar")) return "archive";
  return "other";
}

module.exports = router;
