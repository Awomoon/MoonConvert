const { SUPPORTED_FORMATS } = require("../constants");

function isValidConversion(sourceExt, targetExt) {
  const findFormat = (ext) => {
    for (const [type, config] of Object.entries(SUPPORTED_FORMATS)) {
      if (config.formats.includes(ext.toLowerCase())) {
        return type;
      }
    }
    return null;
  };

  const sourceFormat = findFormat(sourceExt);
  const targetFormat = findFormat(targetExt);

  if (!sourceFormat || !targetFormat) {
    return { valid: false, reason: "Unsupported format" };
  }

  // Same category conversions are allowed
  if (sourceFormat === targetFormat) {
    return { valid: true, reason: "Same category conversion" };
  }

  // Special cross-category conversions
  const allowedCrossConversions = {
    video: ["audio"], // Video to audio extraction
    image: ["pdf"], // Images to PDF (would need additional implementation)
  };

  if (allowedCrossConversions[sourceFormat]?.includes(targetFormat)) {
    return { valid: true, reason: "Cross-category conversion allowed" };
  }

  return {
    valid: false,
    reason: `Cannot convert ${sourceFormat} to ${targetFormat}`,
  };
}

module.exports = isValidConversion;
