const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const libre = require('libreoffice-convert');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const { promisify } = require('util');
const { spawn, exec } = require('child_process');

const app = express();

// Configure FFmpeg paths - adjust these based on your system
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe';

// Set FFmpeg paths
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

// Enhanced logging setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'file-converter' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// System check function
async function checkSystemDependencies() {
  const checks = [];

  // Check FFmpeg
  checks.push(new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      resolve({
        name: 'FFmpeg',
        available: !error,
        path: FFMPEG_PATH,
        error: error?.message
      });
    });
  }));

  // Check LibreOffice
  checks.push(new Promise((resolve) => {
    exec('soffice --version', (error) => {
      resolve({
        name: 'LibreOffice',
        available: !error,
        error: error?.message
      });
    });
  }));

  // Check ImageMagick (optional)
  checks.push(new Promise((resolve) => {
    exec('magick -version', (error) => {
      resolve({
        name: 'ImageMagick',
        available: !error,
        optional: true,
        error: error?.message
      });
    });
  }));

  const results = await Promise.all(checks);

  for (const result of results) {
    if (result.available) {
      logger.info(`✅ ${result.name} is available`);
    } else {
      const level = result.optional ? 'warn' : 'error';
      logger[level](`❌ ${result.name} is not available: ${result.error}`);

      if (!result.optional) {
        throw new Error(`Required dependency ${result.name} is not available. Please install it.`);
      }
    }
  }

  return results;
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/convert', limiter);

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));

// Configure upload directories
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(__dirname, 'temp');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    logger.info('Directories created successfully');
  } catch (error) {
    logger.error('Failed to create directories:', error);
    throw error;
  }
};

// Enhanced storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
      'image/bmp', 'image/tiff', 'image/svg+xml',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
      'audio/mp4', 'audio/x-m4a', 'audio/wma', 'audio/x-wav',
      // Video
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'video/x-ms-wmv', 'video/x-flv', 'video/3gpp', 'video/x-matroska',
      'video/mpeg', 'video/x-ms-asf',
      // Documents
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'application/rtf', 'text/csv',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type: ${file.mimetype}`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Enhanced file cleanup utility
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
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  });

  await Promise.allSettled(cleanupPromises);
}

// Enhanced response handler
function sendConvertedFile(res, filepath, originalName, cleanupFiles = [], metadata = {}) {
  return new Promise((resolve, reject) => {
    if (!fsSync.existsSync(filepath)) {
      return reject(new Error('Output file not found'));
    }

    const mimetype = mime.lookup(filepath) || 'application/octet-stream';
    const stats = fsSync.statSync(filepath);

    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('X-File-Metadata', JSON.stringify(metadata));

    const filestream = fsSync.createReadStream(filepath);

    filestream.pipe(res);

    filestream.on('close', async () => {
      await cleanupFiles(filepath, ...cleanupFiles);
      resolve();
    });

    filestream.on('error', async (err) => {
      logger.error('File stream error:', err);
      await cleanupFiles(filepath, ...cleanupFiles);
      reject(err);
    });
  });
}

// Supported formats
const SUPPORTED_FORMATS = {
  image: {
    formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'tiff'],
    qualityOptions: {
      jpg: { quality: 80, progressive: true },
      jpeg: { quality: 80, progressive: true },
      png: { compressionLevel: 6 },
      webp: { quality: 80, lossless: false },
      avif: { quality: 50, lossless: false }
    }
  },
  audio: {
    formats: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
    qualityOptions: {
      mp3: { audioBitrate: '192k', audioChannels: 2 },
      aac: { audioBitrate: '128k', audioChannels: 2 },
      ogg: { audioBitrate: '192k', audioChannels: 2 }
    }
  },
  video: {
    formats: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'],
    qualityOptions: {
      mp4: { videoBitrate: '1000k', audioBitrate: '128k', preset: 'medium' },
      webm: { videoBitrate: '1000k', audioBitrate: '128k' },
      mov: { videoBitrate: '1000k', audioBitrate: '128k' }
    }
  },
  document: {
    formats: ['pdf', 'docx', 'txt', 'odt', 'rtf', 'html', 'pptx', 'xlsx'],
    qualityOptions: {}
  }
};

// Validation function
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
    return { valid: false, reason: 'Unsupported format' };
  }

  // Same category conversions are allowed
  if (sourceFormat === targetFormat) {
    return { valid: true, reason: 'Same category conversion' };
  }

  // Special cross-category conversions
  const allowedCrossConversions = {
    'video': ['audio'], // Video to audio extraction
    'image': ['pdf'] // Images to PDF (would need additional implementation)
  };

  if (allowedCrossConversions[sourceFormat]?.includes(targetFormat)) {
    return { valid: true, reason: 'Cross-category conversion allowed' };
  }

  return { valid: false, reason: `Cannot convert ${sourceFormat} to ${targetFormat}` };
}

// Enhanced image conversion
async function convertImage(inputPath, outputPath, format, options = {}) {
  try {
    const metadata = await sharp(inputPath).metadata();
    let converter = sharp(inputPath);

    // Apply format-specific options
    const formatOptions = {
      ...SUPPORTED_FORMATS.image.qualityOptions[format],
      ...options
    };

    // Handle different output formats
    switch (format.toLowerCase()) {
      case 'webp':
        converter = converter.webp(formatOptions);
        break;
      case 'jpg':
      case 'jpeg':
        converter = converter.jpeg(formatOptions);
        break;
      case 'png':
        converter = converter.png(formatOptions);
        break;
      case 'avif':
        converter = converter.avif(formatOptions);
        break;
      case 'tiff':
        converter = converter.tiff(formatOptions);
        break;
      case 'bmp':
        converter = converter.toFormat('bmp');
        break;
      default:
        throw new Error(`Unsupported image format: ${format}`);
    }

    const result = await converter.toFile(outputPath);

    return {
      ...result,
      originalMetadata: metadata
    };
  } catch (error) {
    logger.error(`Image conversion error: ${error.message}`);
    throw error;
  }
}

// Enhanced media conversion with better error handling
function convertMedia(inputPath, outputPath, targetFormat, options = {}) {
  return new Promise((resolve, reject) => {
    const formatOptions = {
      ...SUPPORTED_FORMATS[SUPPORTED_FORMATS.audio.formats.includes(targetFormat) ? 'audio' : 'video'].qualityOptions[targetFormat],
      ...options
    };

    logger.info(`Starting media conversion: ${inputPath} -> ${outputPath} (${targetFormat})`);

    const command = ffmpeg(inputPath)
      .on('start', (cmd) => {
        logger.info('FFmpeg command started:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          logger.info(`Processing: ${Math.round(progress.percent)}% complete`);
        }
      })
      .on('error', (err) => {
        logger.error('FFmpeg error:', err.message);
        reject(new Error(`Media conversion failed: ${err.message}`));
      })
      .on('end', () => {
        logger.info('Media conversion completed successfully');
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
        case 'mp3':
          command.audioCodec('libmp3lame');
          break;
        case 'aac':
        case 'm4a':
          command.audioCodec('aac');
          break;
        case 'ogg':
          command.audioCodec('libvorbis');
          break;
        case 'flac':
          command.audioCodec('flac');
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
        command.addOption('-preset', formatOptions.preset);
      }

      // Set codecs based on format
      switch (targetFormat) {
        case 'mp4':
          command.videoCodec('libx264').audioCodec('aac');
          break;
        case 'webm':
          command.videoCodec('libvpx-vp9').audioCodec('libvorbis');
          break;
        case 'mov':
          command.videoCodec('libx264').audioCodec('aac');
          break;
        default:
          command.videoCodec('libx264').audioCodec('aac');
          break;
      }
    }

    command.output(outputPath).run();
  });
}

// Enhanced document conversion
const convertDocument = promisify(libre.convert);

async function convertDocumentEnhanced(inputPath, outputPath, targetExt, options = {}) {
  try {
    logger.info(`Starting document conversion: ${inputPath} -> ${targetExt}`);

    const inputBuffer = await fs.readFile(inputPath);
    const outputFormat = `.${targetExt.replace('.', '')}`;

    // Convert using LibreOffice
    const outputBuffer = await convertDocument(inputBuffer, outputFormat, undefined);

    await fs.writeFile(outputPath, outputBuffer);

    logger.info(`Document conversion completed: ${path.basename(outputPath)}`);
    return {
      outputPath,
      size: outputBuffer.length,
      originalSize: inputBuffer.length
    };
  } catch (error) {
    logger.error(`Document conversion error: ${error.message}`);

    // Try alternative method using LibreOffice command line
    if (error.message.includes('LibreOffice')) {
      return await convertDocumentCLI(inputPath, outputPath, targetExt);
    }

    throw new Error(`Document conversion failed: ${error.message}`);
  }
}

// Alternative document conversion using LibreOffice CLI
async function convertDocumentCLI(inputPath, outputPath, targetExt) {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    const inputFilename = path.basename(inputPath);

    // LibreOffice command line conversion
    const cmd = `libreoffice --headless --convert-to ${targetExt} --outdir "${outputDir}" "${inputPath}"`;

    logger.info(`Executing LibreOffice CLI: ${cmd}`);

    exec(cmd, async (error, stdout, stderr) => {
      if (error) {
        logger.error(`LibreOffice CLI error: ${error.message}`);
        return reject(new Error(`Document conversion failed: ${error.message}`));
      }

      // LibreOffice generates files with original name + new extension
      const expectedOutput = path.join(outputDir, `${path.parse(inputFilename).name}.${targetExt}`);

      try {
        // Move to desired output path
        if (fsSync.existsSync(expectedOutput) && expectedOutput !== outputPath) {
          await fs.rename(expectedOutput, outputPath);
        }

        if (fsSync.existsSync(outputPath)) {
          const stats = await fs.stat(outputPath);
          logger.info(`Document conversion completed via CLI: ${path.basename(outputPath)}`);
          resolve({
            outputPath,
            size: stats.size
          });
        } else {
          reject(new Error('Conversion completed but output file not found'));
        }
      } catch (moveError) {
        logger.error(`Error moving converted file: ${moveError.message}`);
        reject(new Error(`Conversion completed but failed to move output file: ${moveError.message}`));
      }
    });
  });
}

// Enhanced single file conversion endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
  const startTime = Date.now();

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const target = (req.body.target || '').toLowerCase().replace('.', '');
  const quality = parseInt(req.body.quality) || 80;

  if (!target) {
    await cleanupFiles(req.file.path);
    return res.status(400).json({ error: 'Target format is required' });
  }

  const sourceExt = path.extname(req.file.originalname).slice(1).toLowerCase();
  const validation = isValidConversion(sourceExt, target);

  if (!validation.valid) {
    await cleanupFiles(req.file.path);
    return res.status(400).json({
      error: validation.reason,
      supportedFormats: SUPPORTED_FORMATS
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
    if (SUPPORTED_FORMATS.image.formats.includes(sourceExt) &&
        SUPPORTED_FORMATS.image.formats.includes(target)) {
      conversionResult = await convertImage(req.file.path, outPath, target, options);
    }
    else if ((SUPPORTED_FORMATS.audio.formats.includes(sourceExt) ||
              SUPPORTED_FORMATS.video.formats.includes(sourceExt)) &&
             (SUPPORTED_FORMATS.audio.formats.includes(target) ||
              SUPPORTED_FORMATS.video.formats.includes(target))) {
      conversionResult = await convertMedia(req.file.path, outPath, target, options);
    }
    else if (SUPPORTED_FORMATS.document.formats.includes(sourceExt) &&
             SUPPORTED_FORMATS.document.formats.includes(target)) {
      conversionResult = await convertDocumentEnhanced(req.file.path, outPath, target, options);
    }
    // Handle video to audio conversion
    else if (SUPPORTED_FORMATS.video.formats.includes(sourceExt) &&
             SUPPORTED_FORMATS.audio.formats.includes(target)) {
      conversionResult = await convertMedia(req.file.path, outPath, target, options);
    }
    else {
      throw new Error('Unsupported conversion type');
    }

    const processingTime = Date.now() - startTime;
    const outputStats = await fs.stat(outPath);

    const metadata = {
      originalSize: req.file.size,
      convertedSize: outputStats.size,
      processingTime,
      format: target,
      compressionRatio: Math.round((1 - outputStats.size / req.file.size) * 100),
      quality: options.quality
    };

    logger.info(`Conversion completed in ${processingTime}ms: ${req.file.originalname} -> ${outName}`);
    logger.info(`Size change: ${req.file.size} -> ${outputStats.size} bytes (${metadata.compressionRatio}%)`);

    await sendConvertedFile(res, outPath, outName, [req.file.path], metadata);

  } catch (err) {
    logger.error('Conversion error:', err);
    await cleanupFiles(req.file.path, outPath);
    res.status(500).json({
      error: err.message || 'Conversion failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Batch conversion endpoint
app.post('/convert/batch', upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const target = (req.body.target || '').toLowerCase().replace('.', '');
  if (!target) {
    await cleanupFiles(...req.files.map(f => f.path));
    return res.status(400).json({ error: 'Target format is required' });
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
        error: validation.reason
      });
      cleanupPaths.push(file.path);
      continue;
    }

    const outName = `${path.parse(file.originalname).name}-converted.${target}`;
    const outPath = path.join(OUTPUT_DIR, `${Date.now()}-${uuidv4()}-${outName}`);

    try {
      // Use the same conversion logic as single file
      let conversionResult;

      if (SUPPORTED_FORMATS.image.formats.includes(sourceExt) &&
          SUPPORTED_FORMATS.image.formats.includes(target)) {
        conversionResult = await convertImage(file.path, outPath, target);
      }
      else if ((SUPPORTED_FORMATS.audio.formats.includes(sourceExt) ||
                SUPPORTED_FORMATS.video.formats.includes(sourceExt)) &&
               (SUPPORTED_FORMATS.audio.formats.includes(target) ||
                SUPPORTED_FORMATS.video.formats.includes(target))) {
        conversionResult = await convertMedia(file.path, outPath, target);
      }
      else if (SUPPORTED_FORMATS.document.formats.includes(sourceExt) &&
               SUPPORTED_FORMATS.document.formats.includes(target)) {
        conversionResult = await convertDocumentEnhanced(file.path, outPath, target);
      }

      results.push({
        filename: file.originalname,
        success: true,
        convertedName: outName,
        downloadPath: `/download/${path.basename(outPath)}`
      });

      cleanupPaths.push(file.path);
    } catch (conversionError) {
      results.push({
        filename: file.originalname,
        success: false,
        error: conversionError.message
      });
      cleanupPaths.push(file.path, outPath);
    }
  }

  res.json({
    message: 'Batch conversion completed',
    results,
    totalFiles: req.files.length,
    successCount: results.filter(r => r.success).length
  });

  // Cleanup in background
  setImmediate(() => cleanupFiles(...cleanupPaths));
});

// Download endpoint
app.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (!fsSync.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    await sendConvertedFile(res, filepath, filename, [filepath]);
  } catch (error) {
    logger.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get supported formats
app.get('/formats', (req, res) => {
  res.json(SUPPORTED_FORMATS);
});

// System info endpoint with dependency status
app.get('/system-info', async (req, res) => {
  try {
    const dependencies = await checkSystemDependencies();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      supportedFormats: Object.keys(SUPPORTED_FORMATS),
      maxFileSize: '500MB',
      maxBatchFiles: 10,
      dependencies: dependencies.reduce((acc, dep) => {
        acc[dep.name] = dep.available;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      dependencies: {}
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File too large (max 500MB)';
    if (err.code === 'LIMIT_FILE_COUNT') message = 'Too many files (max 10)';
    return res.status(400).json({ error: message, code: err.code });
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Invalid file type',
      supportedFormats: SUPPORTED_FORMATS
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await ensureDirectories();
    await checkSystemDependencies();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info('📁 Upload directory:', UPLOAD_DIR);
      logger.info('📤 Output directory:', OUTPUT_DIR);
      logger.info('🔧 Environment:', process.env.NODE_ENV || 'development');
      logger.info('📋 Supported formats:', Object.keys(SUPPORTED_FORMATS));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    logger.error('Make sure FFmpeg and LibreOffice are installed and accessible in your PATH');
    process.exit(1);
  }
}

startServer();
