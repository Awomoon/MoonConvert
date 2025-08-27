const app = require("./app");
const { logger } = require("./utils/logger");

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await ensureDirectories();
    await checkSystemDependencies();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info("📁 Upload directory:", UPLOAD_DIR);
      logger.info("📤 Output directory:", OUTPUT_DIR);
      logger.info("🔧 Environment:", process.env.NODE_ENV || "development");
      logger.info("📋 Supported formats:", Object.keys(SUPPORTED_FORMATS));
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    logger.error(
      "Make sure FFmpeg and LibreOffice are installed and accessible in your PATH"
    );
    process.exit(1);
  }
}

startServer();
