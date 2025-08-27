const fsSync = require("fs");
const mime = require("mime-types");
const cleanup = require("./cleanup");

function sendConvertedFile(
  res,
  filepath,
  originalName,
  cleanupFiles = [],
  metadata = {}
) {
  return new Promise((resolve, reject) => {
    if (!fsSync.existsSync(filepath)) {
      return reject(new Error("Output file not found"));
    }

    const mimetype = mime.lookup(filepath) || "application/octet-stream";
    const stats = fsSync.statSync(filepath);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalName}"`
    );
    res.setHeader("Content-Type", mimetype);
    res.setHeader("Content-Length", stats.size);
    res.setHeader("X-File-Metadata", JSON.stringify(metadata));

    const filestream = fsSync.createReadStream(filepath);

    filestream.pipe(res);

    filestream.on("close", async () => {
      await cleanup(filepath, ...cleanupFiles);
      resolve();
    });

    filestream.on("error", async (err) => {
      logger.error("File stream error:", err);
      await cleanup(filepath, ...cleanupFiles);
      reject(err);
    });
  });
}

module.exports = sendConvertedFile;
