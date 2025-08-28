import { useContext } from "react";
import { FileContext } from "../context/fileContextInstance";

const ProgressBar = () => {
  const { progress } = useContext(FileContext);

  return (
    <>
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
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </div>
          </div>
        </div>
      )}
      ;
    </>
  );
};

export default ProgressBar;
