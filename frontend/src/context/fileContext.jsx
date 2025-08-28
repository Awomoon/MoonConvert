import { useState } from "react";
import { FileContext } from "./fileContextInstance";

export const FileProvider = ({ children }) => {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [progress, setProgress] = useState(0);
  const [recentConversions, setRecentConversions] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState("");

  const supportedFormats = {
    audio: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
    video: ["mp4", "webm", "mov", "avi", "mkv", "wmv", "flv"],
    image: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "svg"],
    document: ["pdf", "docx", "txt", "odt", "rtf", "html", "epub"],
  };

  return (
    <FileContext.Provider
      value={{
        file,
        setFile,
        target,
        setTarget,
        supportedFormats,
        message,
        setMessage,
        progress,
        setProgress,
        recentConversions,
        setRecentConversions,
        downloadUrl,
        setDownloadUrl,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};
