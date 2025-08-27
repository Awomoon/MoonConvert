const fs = require("fs").promises;
const { UPLOAD_DIR, TEMP_DIR } = require("../constants");
const { logger } = require("./logger");

const ensureDirectories = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    logger.info("Directories created successfully");
  } catch (error) {
    logger.error("Failed to create directories:", error);
    throw error;
  }
};

module.exports = ensureDirectories;
