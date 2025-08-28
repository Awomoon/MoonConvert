import { useContext, useState } from "react";
import { FileContext } from "../context/fileContextInstance";
import { Loader2, RotateCcw, Wand2 } from "lucide-react";

const ActionButtons = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    target,
    file,
    setProgress,
    setMessage,
    setRecentConversions,
    setDownloadUrl,
    setFile,
    setTarget,
  } = useContext(FileContext);

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

  const handleSubmit = async () => {
    if (!file) return setMessage({ text: "No file selected", type: "error" });
    if (!target)
      return setMessage({ text: "No target format selected", type: "error" });

    try {
      setIsLoading(true);
      setProgress(0);
      setMessage({ text: "Converting your file...", type: "info" });

      await simulateConversion();
    } catch (error) {
      console.error("Conversion error:", error);
      setMessage({
        text: "Conversion failed. Please try again.",
        type: "error",
      });
    } finally {
      setProgress(0);
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTarget("");
    setDownloadUrl("");
    setMessage({ text: "", type: "" });
  };

  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={handleSubmit}
        disabled={isLoading || !target || !file}
        className={`flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 ${
          isLoading || !target || !file
            ? "opacity-70 cursor-not-allowed"
            : "cursor-pointer hover:from-purple-600 hover:to-pink-600"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="size-5 animate-spin" />
            <span>Converting...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Wand2 className="size-5" />
            <span>Convert File</span>
          </div>
        )}
      </button>

      <button
        onClick={resetForm}
        type="reset"
        className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 transition-all duration-200 flex items-center justify-center rounded-xl"
      >
        <RotateCcw className="size-5" />
      </button>
    </div>
  );
};

export default ActionButtons;
