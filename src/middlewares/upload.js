const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    "image/jpeg": true,
    "image/jpg": true,
    "image/png": true,
    "image/gif": true,
    "image/webp": true,
    "application/pdf": true,
    "application/msword": true,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
    "text/plain": true,
    "application/vnd.ms-excel": true,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
    "video/mp4": true,
    "video/mpeg": true,
    "video/quicktime": true,
    "application/zip": true,
    "application/x-rar-compressed": true,
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, documents, videos, and archives are allowed."
      ),
      false
    );
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "general";

    // Organize files by type
    if (file.mimetype.startsWith("image/")) {
      folder = "images";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "videos";
    } else if (
      file.mimetype.startsWith("application/") ||
      file.mimetype.startsWith("text/")
    ) {
      folder = "documents";
    }

    const dest = path.join(uploadDir, folder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 5, // Max 5 files at once
  },
});

// Middleware for single file upload
exports.uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res
              .status(400)
              .json({ error: "File size too large. Maximum size is 50MB." });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res
              .status(400)
              .json({ error: "Too many files. Maximum 5 files allowed." });
          }
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

// Middleware for multiple files upload
exports.uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res
              .status(400)
              .json({ error: "File size too large. Maximum size is 50MB." });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res
              .status(400)
              .json({
                error: `Too many files. Maximum ${maxCount} files allowed.`,
              });
          }
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

// Middleware for specific fields upload
exports.uploadFields = (fields) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.fields(fields);
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res
              .status(400)
              .json({ error: "File size too large. Maximum size is 50MB." });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({ error: "Too many files." });
          }
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

// Serve uploaded files statically
exports.serveFile = (req, res, next) => {
  const filePath = path.join(
    uploadDir,
    req.params.folder || "",
    req.params.filename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
};

// Delete file utility
exports.deleteFile = (filePath) => {
  const fullPath = path.join(uploadDir, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

// Get file URL for response
exports.getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const relativePath = filePath.replace(uploadDir, "").replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/api/uploads${relativePath}`;
};
