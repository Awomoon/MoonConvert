import { useCallback, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, File, X } from "lucide-react";
import { formatFileSize } from "../utils";
import { FileContext } from "../context/fileContextInstance";

const Uploader = () => {
  const { file, setFile, supportedFormats } = useContext(FileContext);

  const onDrop = useCallback(
    (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
    [setFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: supportedFormats,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-6 mb-6 transition-all cursor-pointer duration-300 ${
        isDragActive
          ? "border-purple-400 bg-purple-500/20"
          : "border-gray-400 hover:border-purple-400 hover:bg-white/5"
      }`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <File className="size-16" />
            <button
              className="absolute top-2 right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
              type="button"
              onClick={() => setFile(null)}
            >
              <span className="sr-only">Remove file</span>
              <X className="size-4" />
            </button>
          </div>

          <div>
            <p className="text-white font-semibold text-lg truncate">
              {file.name}
            </p>
            <p className="text-gray-300 text-sm">{formatFileSize(file.size)}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <CloudUpload className="size-16" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg mb-2">
              {isDragActive
                ? "Drop your file here"
                : "Drag & drop your file here"}
            </p>
            <p className="text-gray-400 text-sm">
              Supports: {Object.values(supportedFormats).flat().join(", ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Uploader;
