const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { SUPPORTED_FORMATS } = require("../constants");
const {
  isValidConversion,
  logger,
  cleanupFiles,
  convertImage,
  convertMedia,
  convertDocumentEnhanced,
} = require("../utils/");

exports.singleFileConvertController = async (req, res) => {
  const startTime = Date.now();

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const target = (req.body.target || "").toLowerCase().replace(".", "");
  const quality = parseInt(req.body.quality) || 80;

  if (!target) {
    await cleanupFiles(req.file.path);
    return res.status(400).json({ error: "Target format is required" });
  }

  const sourceExt = path.extname(req.file.originalname).slice(1).toLowerCase();
  const validation = isValidConversion(sourceExt, target);

  if (!validation.valid) {
    await cleanupFiles(req.file.path);
    return res.status(400).json({
      error: validation.reason,
      supportedFormats: SUPPORTED_FORMATS,
    });
  }

  const originalName = path.parse(req.file.originalname).name;
  const outName = `${originalName}-converted.${target}`;
  const outPath = path.join(OUTPUT_DIR, `${Date.now()}-${uuidv4()}-${outName}`);

  try {
    logger.info(`Starting conversion: ${req.file.originalname} -> ${target}`);

    let conversionResult;
    const options = { quality };

    // Determine conversion type and execute
    if (
      SUPPORTED_FORMATS.image.formats.includes(sourceExt) &&
      SUPPORTED_FORMATS.image.formats.includes(target)
    ) {
      conversionResult = await convertImage(
        req.file.path,
        outPath,
        target,
        options
      );
    } else if (
      (SUPPORTED_FORMATS.audio.formats.includes(sourceExt) ||
        SUPPORTED_FORMATS.video.formats.includes(sourceExt)) &&
      (SUPPORTED_FORMATS.audio.formats.includes(target) ||
        SUPPORTED_FORMATS.video.formats.includes(target))
    ) {
      conversionResult = await convertMedia(
        req.file.path,
        outPath,
        target,
        options
      );
    } else if (
      SUPPORTED_FORMATS.document.formats.includes(sourceExt) &&
      SUPPORTED_FORMATS.document.formats.includes(target)
    ) {
      conversionResult = await convertDocumentEnhanced(
        req.file.path,
        outPath,
        target,
        options
      );
    }
    // Handle video to audio conversion
    else if (
      SUPPORTED_FORMATS.video.formats.includes(sourceExt) &&
      SUPPORTED_FORMATS.audio.formats.includes(target)
    ) {
      conversionResult = await convertMedia(
        req.file.path,
        outPath,
        target,
        options
      );
    } else {
      throw new Error("Unsupported conversion type");
    }

    const processingTime = Date.now() - startTime;
    const outputStats = await fs.stat(outPath);

    const metadata = {
      originalSize: req.file.size,
      convertedSize: outputStats.size,
      processingTime,
      format: target,
      compressionRatio: Math.round(
        (1 - outputStats.size / req.file.size) * 100
      ),
      quality: options.quality,
    };

    logger.info(
      `Conversion completed in ${processingTime}ms: ${req.file.originalname} -> ${outName}`
    );
    logger.info(
      `Size change: ${req.file.size} -> ${outputStats.size} bytes (${metadata.compressionRatio}%)`
    );

    await sendConvertedFile(res, outPath, outName, [req.file.path], metadata);
  } catch (err) {
    logger.error("Conversion error:", err);
    await cleanupFiles(req.file.path, outPath);
    res.status(500).json({
      error: err.message || "Conversion failed",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

exports.multipleFileConvertController = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const target = (req.body.target || "").toLowerCase().replace(".", "");
  if (!target) {
    await cleanupFiles(...req.files.map((f) => f.path));
    return res.status(400).json({ error: "Target format is required" });
  }

  const results = [];
  const cleanupPaths = [];

  for (const file of req.files) {
    const sourceExt = path.extname(file.originalname).slice(1).toLowerCase();
    const validation = isValidConversion(sourceExt, target);

    if (!validation.valid) {
      results.push({
        filename: file.originalname,
        success: false,
        error: validation.reason,
      });
      cleanupPaths.push(file.path);
      continue;
    }

    const outName = `${path.parse(file.originalname).name}-converted.${target}`;
    const outPath = path.join(
      OUTPUT_DIR,
      `${Date.now()}-${uuidv4()}-${outName}`
    );

    try {
      // Use the same conversion logic as single file
      let conversionResult;

      if (
        SUPPORTED_FORMATS.image.formats.includes(sourceExt) &&
        SUPPORTED_FORMATS.image.formats.includes(target)
      ) {
        conversionResult = await convertImage(file.path, outPath, target);
      } else if (
        (SUPPORTED_FORMATS.audio.formats.includes(sourceExt) ||
          SUPPORTED_FORMATS.video.formats.includes(sourceExt)) &&
        (SUPPORTED_FORMATS.audio.formats.includes(target) ||
          SUPPORTED_FORMATS.video.formats.includes(target))
      ) {
        conversionResult = await convertMedia(file.path, outPath, target);
      } else if (
        SUPPORTED_FORMATS.document.formats.includes(sourceExt) &&
        SUPPORTED_FORMATS.document.formats.includes(target)
      ) {
        conversionResult = await convertDocumentEnhanced(
          file.path,
          outPath,
          target
        );
      }

      results.push({
        filename: file.originalname,
        success: true,
        convertedName: outName,
        downloadPath: `/download/${path.basename(outPath)}`,
      });

      cleanupPaths.push(file.path);
    } catch (conversionError) {
      results.push({
        filename: file.originalname,
        success: false,
        error: conversionError.message,
      });
      cleanupPaths.push(file.path, outPath);
    }
  }

  res.json({
    message: "Batch conversion completed",
    results,
    totalFiles: req.files.length,
    successCount: results.filter((r) => r.success).length,
  });

  // Cleanup in background
  setImmediate(() => cleanupFiles(...cleanupPaths));
};
