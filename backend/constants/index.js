const multer = require("multer");
const { promisify } = require("util");
const libre = require("libreoffice-convert");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      // Audio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/aac",
      "audio/flac",
      "audio/mp4",
      "audio/x-m4a",
      "audio/wma",
      "audio/x-wav",
      // Video
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/x-flv",
      "video/3gpp",
      "video/x-matroska",
      "video/mpeg",
      "video/x-ms-asf",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/rtf",
      "text/csv",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type: ${file.mimetype}`);
      error.code = "INVALID_FILE_TYPE";
      cb(error, false);
    }
  },
});

const SUPPORTED_FORMATS = {
  image: {
    formats: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif", "tiff"],
    qualityOptions: {
      jpg: { quality: 80, progressive: true },
      jpeg: { quality: 80, progressive: true },
      png: { compressionLevel: 6 },
      webp: { quality: 80, lossless: false },
      avif: { quality: 50, lossless: false },
    },
  },
  audio: {
    formats: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
    qualityOptions: {
      mp3: { audioBitrate: "192k", audioChannels: 2 },
      aac: { audioBitrate: "128k", audioChannels: 2 },
      ogg: { audioBitrate: "192k", audioChannels: 2 },
    },
  },
  video: {
    formats: ["mp4", "webm", "mov", "avi", "mkv", "flv"],
    qualityOptions: {
      mp4: { videoBitrate: "1000k", audioBitrate: "128k", preset: "medium" },
      webm: { videoBitrate: "1000k", audioBitrate: "128k" },
      mov: { videoBitrate: "1000k", audioBitrate: "128k" },
    },
  },
  document: {
    formats: ["pdf", "docx", "txt", "odt", "rtf", "html", "pptx", "xlsx"],
    qualityOptions: {},
  },
};

const UPLOAD_DIR = path.join(__dirname, "uploads");
const TEMP_DIR = path.join(__dirname, "temp");
const OUTPUT_DIR = path.join(__dirname, "output");

const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE_PATH = process.env.FFPROBE_PATH || "ffprobe";

const convertDocument = promisify(libre.convert);

module.exports = {
  storage,
  upload,
  SUPPORTED_FORMATS,
  UPLOAD_DIR,
  TEMP_DIR,
  OUTPUT_DIR,
  FFMPEG_PATH,
  FFPROBE_PATH,
  convertDocument,
};
