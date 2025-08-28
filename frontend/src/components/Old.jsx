import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  File,
  Download,
  RotateCcw,
  Wand2,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Music,
  Video,
  Image,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  CloudUpload,
  X,
  Clock,
} from "lucide-react";
import AnimatedBackground from "./components/AnimatedBackground";

export default function Convert() {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState("");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isConverting, setIsConverting] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentConversions, setRecentConversions] = useState([]);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Supported formats categorized
  const supportedFormats = {
    audio: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
    video: ["mp4", "webm", "mov", "avi", "mkv", "wmv", "flv"],
    image: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "svg"],
    document: ["pdf", "docx", "txt", "odt", "rtf", "html", "epub"],
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFormatDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter formats based on search term
  const filteredFormats = Object.entries(supportedFormats).reduce(
    (acc, [category, formats]) => {
      const filtered = formats.filter((format) =>
        format.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {}
  );

  const handleFile = useCallback(
    (selectedFile) => {
      if (!selectedFile) return;

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setMessage({ text: "File size must be less than 50MB", type: "error" });
        return;
      }

      // Validate file extension
      const fileExt = selectedFile.name.split(".").pop().toLowerCase();
      const allFormats = Object.values(supportedFormats).flat();
      if (!allFormats.includes(fileExt)) {
        setMessage({
          text: `Unsupported file type (.${fileExt}). Please select a different file.`,
          type: "error",
        });
        return;
      }

      setFile(selectedFile);
      setDownloadUrl(null);
      setMessage({ text: "", type: "" });
      setIsDragOver(false);
    },
    [supportedFormats]
  );
  const handleFileInputChange = (e) => {
    handleFile(e.target.files[0]);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFile(droppedFiles[0]);
      }
    },
    [handleFile]
  );

  const simulateConversion = async () => {
    // Simulating conversion process since we don't have a backend
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Create a dummy blob for download
    const dummyContent = `Converted file: ${file.name} -> ${target}`;
    const blob = new Blob([dummyContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);

    // Add to recent conversions
    setRecentConversions((prev) => [
      {
        originalName: file.name,
        originalType: file.name.split(".").pop(),
        targetType: target,
        date: new Date().toLocaleString(),
        downloadUrl: url,
      },
      ...prev.slice(0, 4), // Keep only 5 most recent
    ]);

    setMessage({ text: "Conversion successful!", type: "success" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage({ text: "Please select or drag a file", type: "error" });
      return;
    }

    if (!target) {
      setMessage({ text: "Please select target format", type: "error" });
      return;
    }

    try {
      setIsConverting(true);
      setProgress(0);
      setMessage({ text: "Converting your file...", type: "info" });

      await simulateConversion();
    } catch (err) {
      console.error("Conversion error:", err);
      setMessage({
        text: "Conversion failed. Please try again.",
        type: "error",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTarget("");
    setDownloadUrl(null);
    setMessage({ text: "", type: "" });
    setSearchTerm("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormatSelect = (format) => {
    setTarget(format);
    setShowFormatDropdown(false);
    setSearchTerm("");
  };

  const getFileIcon = (filename) => {
    if (!filename) return File;
    const ext = filename.split(".").pop().toLowerCase();
    if (supportedFormats.audio.includes(ext)) return Music;
    if (supportedFormats.video.includes(ext)) return Video;
    if (supportedFormats.image.includes(ext)) return Image;
    if (supportedFormats.document.includes(ext)) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const FileIcon = getFileIcon(file?.name);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-8">
      {/* Animated background elements */}
      <AnimatedBackground />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Universal File Converter
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6">
            Transform files effortlessly with Moon-Convert
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Converter Card */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
            {/* File Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-6 mb-6 transition-all duration-300 ${
                isDragOver
                  ? "border-purple-400 bg-purple-500/20"
                  : "border-gray-400 hover:border-purple-400 hover:bg-white/5"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center relative">
                      <FileIcon className="w-16 h-16 text-purple-400" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetForm();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg truncate">
                        {file.name}
                      </p>
                      <p className="text-gray-300 text-sm">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <CloudUpload className="w-16 h-16 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg mb-2">
                        {isDragOver
                          ? "Drop your file here"
                          : "Drag & drop your file here"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Supports:{" "}
                        {Object.values(supportedFormats).flat().join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={Object.values(supportedFormats)
                  .flat()
                  .map((ext) => `.${ext}`)
                  .join(",")}
              />
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">
                Target Format
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 text-left text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-between"
                >
                  <span>
                    {target ? (
                      <span className="bg-purple-500 px-3 py-1 rounded-full text-sm font-semibold">
                        {target.toUpperCase()}
                      </span>
                    ) : (
                      "Select target format"
                    )}
                  </span>
                  {showFormatDropdown ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {showFormatDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-white/20">
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search formats..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Format Categories */}
                    <div className="max-h-80 overflow-y-auto">
                      {Object.entries(filteredFormats).length > 0 ? (
                        Object.entries(filteredFormats).map(
                          ([category, formats]) => (
                            <div key={category} className="p-4">
                              <h4 className="text-white font-semibold mb-3 capitalize flex items-center">
                                {category === "audio" && (
                                  <Music className="w-4 h-4 mr-2" />
                                )}
                                {category === "video" && (
                                  <Video className="w-4 h-4 mr-2" />
                                )}
                                {category === "image" && (
                                  <Image className="w-4 h-4 mr-2" />
                                )}
                                {category === "document" && (
                                  <FileText className="w-4 h-4 mr-2" />
                                )}
                                {category}
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {formats.map((format) => (
                                  <button
                                    key={format}
                                    onClick={() => handleFormatSelect(format)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                                      target === format
                                        ? "bg-purple-500 text-white"
                                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                                    }`}
                                  >
                                    {format.toUpperCase()}
                                    {target === format && (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="p-8 text-center text-gray-400">
                          No formats match your search
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleSubmit}
                disabled={isConverting || !target || !file}
                className={`flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isConverting || !target || !file
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:from-purple-600 hover:to-pink-600"
                }`}
              >
                {isConverting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Convert File</span>
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            {progress > 0 && progress < 100 && (
              <div className="mb-6">
                <div className="flex justify-between text-white text-sm mb-1">
                  <span>Converting...</span>
                  <span>{progress}%</span>
                </div>
                <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {message.text && (
              <div
                className={`p-4 rounded-xl mb-6 flex items-start space-x-3 ${
                  message.type === "error"
                    ? "bg-red-500/20 border border-red-500/50 text-red-200"
                    : message.type === "success"
                    ? "bg-green-500/20 border border-green-500/50 text-green-200"
                    : "bg-blue-500/20 border border-blue-500/50 text-blue-200"
                }`}
              >
                {message.type === "error" && (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                {message.type === "success" && (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                {message.type === "info" && (
                  <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <span className="flex-1">{message.text}</span>
                <button
                  onClick={() => setMessage({ text: "", type: "" })}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Download Section */}
            {downloadUrl && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 text-center">
                <h3 className="text-white font-semibold text-lg mb-4">
                  Your file is ready! 🎉
                </h3>
                <a
                  href={downloadUrl}
                  download={`converted.${target}`}
                  className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  <span>Download {target.toUpperCase()} File</span>
                </a>
              </div>
            )}
          </div>

          {/* Recent Conversions Sidebar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
            <h3 className="text-white font-semibold text-xl mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Conversions
            </h3>

            {recentConversions.length > 0 ? (
              <div className="space-y-4">
                {recentConversions.map((conversion, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium truncate">
                          {conversion.originalName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {conversion.originalType} → {conversion.targetType}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {conversion.date}
                      </span>
                    </div>
                    <a
                      href={conversion.downloadUrl}
                      download={`converted.${conversion.targetType}`}
                      className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download again
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p>Your recent conversions will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Made with ❤️ by Moontech • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </main>
  );
}
