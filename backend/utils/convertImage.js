const sharp = require("sharp");
const { SUPPORTED_FORMATS } = require("../constants");
const { logger } = require("./logger");

async function convertImage(inputPath, outputPath, format, options = {}) {
  try {
    const metadata = await sharp(inputPath).metadata();
    let converter = sharp(inputPath);

    // Apply format-specific options
    const formatOptions = {
      ...SUPPORTED_FORMATS.image.qualityOptions[format],
      ...options,
    };

    // Handle different output formats
    switch (format.toLowerCase()) {
      case "webp":
        converter = converter.webp(formatOptions);
        break;
      case "jpg":
      case "jpeg":
        converter = converter.jpeg(formatOptions);
        break;
      case "png":
        converter = converter.png(formatOptions);
        break;
      case "avif":
        converter = converter.avif(formatOptions);
        break;
      case "tiff":
        converter = converter.tiff(formatOptions);
        break;
      case "bmp":
        converter = converter.toFormat("bmp");
        break;
      default:
        throw new Error(`Unsupported image format: ${format}`);
    }

    const result = await converter.toFile(outputPath);

    return {
      ...result,
      originalMetadata: metadata,
    };
  } catch (error) {
    logger.error(`Image conversion error: ${error.message}`);
    throw error;
  }
}

module.exports = convertImage;
