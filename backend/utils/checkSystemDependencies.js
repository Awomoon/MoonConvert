const { exec } = require("child_process");
const { logger } = require("./logger");

async function checkSystemDependencies() {
  const checks = [];

  // Check FFmpeg
  checks.push(
    new Promise((resolve) => {
      exec("ffmpeg -version", (error) => {
        resolve({
          name: "FFmpeg",
          available: !error,
          path: FFMPEG_PATH,
          error: error?.message,
        });
      });
    })
  );

  // Check LibreOffice
  checks.push(
    new Promise((resolve) => {
      exec("soffice --version", (error) => {
        resolve({
          name: "LibreOffice",
          available: !error,
          error: error?.message,
        });
      });
    })
  );

  // Check ImageMagick (optional)
  checks.push(
    new Promise((resolve) => {
      exec("magick -version", (error) => {
        resolve({
          name: "ImageMagick",
          available: !error,
          optional: true,
          error: error?.message,
        });
      });
    })
  );

  const results = await Promise.all(checks);

  for (const result of results) {
    if (result.available) {
      logger.info(`✅ ${result.name} is available`);
    } else {
      const level = result.optional ? "warn" : "error";
      logger[level](`❌ ${result.name} is not available: ${result.error}`);

      if (!result.optional) {
        throw new Error(
          `Required dependency ${result.name} is not available. Please install it.`
        );
      }
    }
  }

  return results;
}

module.exports = checkSystemDependencies;
