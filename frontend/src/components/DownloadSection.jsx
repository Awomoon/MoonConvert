import { useContext } from "react";
import { FileContext } from "../context/fileContextInstance";
import { Download } from "lucide-react";

const DownloadSection = () => {
  const { downloadUrl, target } = useContext(FileContext);

  return (
    <>
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
    </>
  );
};

export default DownloadSection;
