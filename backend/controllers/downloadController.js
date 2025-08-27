const fsSync = require("fs");
const path = require("path");
const { OUTPUT_DIR } = require("../constants");
const { sendConvertedFile, logger } = require("../utils");

const downloadController = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (!fsSync.existsSync(filepath)) {
      return res.status(404).json({ error: "File not found" });
    }

    await sendConvertedFile(res, filepath, filename, [filepath]);
  } catch (error) {
    logger.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
};

module.exports = downloadController;
