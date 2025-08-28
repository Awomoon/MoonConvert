import { useContext } from "react";
import { FileContext } from "../context/fileContextInstance";
import { Clock, Download, FileText } from "lucide-react";

const RecentConversions = () => {
  const { recentConversions } = useContext(FileContext);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
      <h3 className="text-white font-semibold text-xl mb-6 flex items-center">
        <Clock className="size-5 mr-2" />
        Recent Conversions
      </h3>

      {recentConversions.length > 0 ? (
        <div>
          {recentConversions.map((conversion, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex flex-col gap-2 justify-between items-start mb-2">
                <div>
                  <p className="text-white font-medium truncate max-w-[200px]">
                    {conversion.originalName}
                  </p>
                  <p className="text-gray-200 text-xs">
                    {conversion.originalType} → {conversion.targetType}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{conversion.date}</span>
              </div>

              <a
                href={conversion.downloadUrl}
                download={`converted.${conversion.targetType}`}
                className="inline-flex items-center mt-4 text-sm text-purple-400 hover:text-purple-300 hover:underline"
              >
                <Download className="size-4 mr-1" />
                Download again
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <FileText className="size-8 mx-auto mb-2" />
          <p>Your recent conversions will appear here</p>
        </div>
      )}
    </div>
  );
};

export default RecentConversions;
