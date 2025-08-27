const { exec } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const { SUPPORTED_FORMATS } = require("../constants");
const { logger } = require("./logger");

/**
 * Convert media file to a target format using ffmpeg
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path to output file (without extension)
 * @param {string} target - Target format (e.g. "mp3", "mp4", "png")
 * @param {object} options - Optional override options for ffmpeg
 * @returns {Promise<string>} Resolves with the final output file path
 */

async function convertMedia(inputPath, outputPath, target, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // 🔎 1. Find which category the format belongs to
      let category = null;
      for (const [type, { formats }] of Object.entries(SUPPORTED_FORMATS)) {
        if (formats.includes(target)) {
          category = type;
          break;
        }
      }

      if (!category) {
        logger.error(`Unsupported format: ${target}`);
        return reject(new Error(`Unsupported format: ${target}`));
      }

      // 🔎 2. Get default quality options for this format
      const defaultOptions =
        SUPPORTED_FORMATS[category].qualityOptions[target] || {};
      const finalOptions = { ...defaultOptions, ...options };

      // 🔎 3. Build ffmpeg arguments
      const args = [`-i "${inputPath}"`];

      // Handle image formats
      if (category === "image") {
        if (finalOptions.quality) args.push(`-q:v ${finalOptions.quality}`);
        if (finalOptions.compressionLevel !== undefined) {
          args.push(`-compression_level ${finalOptions.compressionLevel}`);
        }
        if (finalOptions.lossless) args.push(`-lossless 1`);
      }

      // Handle audio formats
      if (category === "audio") {
        if (finalOptions.audioBitrate)
          args.push(`-b:a ${finalOptions.audioBitrate}`);
        if (finalOptions.audioChannels)
          args.push(`-ac ${finalOptions.audioChannels}`);
      }

      // Handle video formats
      if (category === "video") {
        if (finalOptions.videoBitrate)
          args.push(`-b:v ${finalOptions.videoBitrate}`);
        if (finalOptions.audioBitrate)
          args.push(`-b:a ${finalOptions.audioBitrate}`);
        if (finalOptions.preset) args.push(`-preset ${finalOptions.preset}`);
      }

      // Output file with extension
      const finalOutput = `${outputPath}.${target}`;
      args.push(`"${finalOutput}"`);

      const command = `${ffmpegPath} ${args.join(" ")}`;

      logger.info(`Running ffmpeg command: ${command}`);

      // 🔎 4. Execute ffmpeg
      exec(command, (err, stdout, stderr) => {
        if (err) {
          logger.error(`ffmpeg failed: ${stderr}`);
          return reject(err);
        }
        logger.info(`Conversion successful: ${finalOutput}`);
        resolve(finalOutput);
      });
    } catch (error) {
      logger.error(`convertMedia error: ${error.message}`);
      reject(error);
    }
  });
}

module.exports = convertMedia;
