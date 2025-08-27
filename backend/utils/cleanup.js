const fsSync = require("fs");
const fs = require("fs").promises;
const { logger } = require("./logger");

async function cleanupFiles(...files) {
  const cleanupPromises = files.filter(Boolean).map(async (file) => {
    let retries = 3;
    while (retries > 0) {
      try {
        if (fsSync.existsSync(file)) {
          await fs.unlink(file);
          logger.info(`Cleaned up file: ${file}`);
        }
        break;
      } catch (err) {
        retries--;
        if (retries === 0) {
          logger.error(`Failed to cleanup file after retries: ${file}`, err);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  });

  await Promise.allSettled(cleanupPromises);
}

module.exports = cleanupFiles;
