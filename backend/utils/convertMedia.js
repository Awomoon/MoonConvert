const ffmpeg = require("fluent-ffmpeg");
const { SUPPORTED_FORMATS } = require("../constants");
const { logger } = require("./logger");

function convertMedia(inputPath, outputPath, targetFormat, options = {}) {
  return new Promise((resolve, reject) => {
    const formatOptions = {
      ...SUPPORTED_FORMATS[
        SUPPORTED_FORMATS.audio.formats.includes(targetFormat)
          ? "audio"
          : "video"
      ].qualityOptions[targetFormat],
      ...options,
    };

    logger.info(
      `Starting media conversion: ${inputPath} -> ${outputPath} (${targetFormat})`
    );

    const command = ffmpeg(inputPath)
      .on("start", (cmd) => {
        logger.info("FFmpeg command started:", cmd);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          logger.info(`Processing: ${Math.round(progress.percent)}% complete`);
        }
      })
      .on("error", (err) => {
        logger.error("FFmpeg error:", err.message);
        reject(new Error(`Media conversion failed: ${err.message}`));
      })
      .on("end", () => {
        logger.info("Media conversion completed successfully");
        resolve({ outputPath, metadata: formatOptions });
      });

    // Configure based on target format
    if (SUPPORTED_FORMATS.audio.formats.includes(targetFormat)) {
      // Audio conversion - remove video stream
      command.noVideo();

      if (formatOptions.audioBitrate) {
        command.audioBitrate(formatOptions.audioBitrate);
      }
      if (formatOptions.audioChannels) {
        command.audioChannels(formatOptions.audioChannels);
      }

      // Set appropriate codec based on format
      switch (targetFormat) {
        case "mp3":
          command.audioCodec("libmp3lame");
          break;
        case "aac":
        case "m4a":
          command.audioCodec("aac");
          break;
        case "ogg":
          command.audioCodec("libvorbis");
          break;
        case "flac":
          command.audioCodec("flac");
          break;
        default:
          break;
      }
    } else if (SUPPORTED_FORMATS.video.formats.includes(targetFormat)) {
      // Video conversion
      if (formatOptions.videoBitrate) {
        command.videoBitrate(formatOptions.videoBitrate);
      }
      if (formatOptions.audioBitrate) {
        command.audioBitrate(formatOptions.audioBitrate);
      }
      if (formatOptions.preset) {
        command.addOption("-preset", formatOptions.preset);
      }

      // Set codecs based on format
      switch (targetFormat) {
        case "mp4":
          command.videoCodec("libx264").audioCodec("aac");
          break;
        case "webm":
          command.videoCodec("libvpx-vp9").audioCodec("libvorbis");
          break;
        case "mov":
          command.videoCodec("libx264").audioCodec("aac");
          break;
        default:
          command.videoCodec("libx264").audioCodec("aac");
          break;
      }
    }

    command.output(outputPath).run();
  });
}

module.exports = convertMedia;
