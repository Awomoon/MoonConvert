const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const multer = require("multer");
const { logger } = require("./utils/logger");
const convertRouter = require("./routes/convertRoutes");
const downloadController = require("./controllers/downloadController");
const { SUPPORTED_FORMATS } = require("./constants");
const systemInfoController = require("./controllers/systemInfoController");

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Compression middleware
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: "10mb" }));

// convert endpoint
app.use("/convert", limiter, convertRouter);

// Download endpoint
app.get("/download/:filename", downloadController);

// Get supported formats
app.get("/formats", (req, res) => {
  res.json(SUPPORTED_FORMATS);
});

// System info endpoint with dependency status
app.get("/system-info", systemInfoController);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);

  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    if (err.code === "LIMIT_FILE_SIZE") message = "File too large (max 500MB)";
    if (err.code === "LIMIT_FILE_COUNT") message = "Too many files (max 10)";
    return res.status(400).json({ error: message, code: err.code });
  }

  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      error: "Invalid file type",
      supportedFormats: SUPPORTED_FORMATS,
    });
  }

  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
