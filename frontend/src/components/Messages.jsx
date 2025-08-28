import { useContext } from "react";
import { FileContext } from "../context/fileContextInstance";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

const Messages = () => {
  const { message, setMessage } = useContext(FileContext);

  return (
    <>
      {message.text && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-center space-x-3 border ${
            message.type === "error"
              ? "bg-red-500/20 border-red-500/50 text-red-200"
              : message.type === "success"
              ? "bg-green-500/20 border-green-500/50 text-green-200"
              : "bg-blue-500/20 border-blue-500/50 text-blue-200"
          }`}
        >
          {message.type === "error" && (
            <AlertCircle className="size-5 mt-0.5 flex-shrink-0" />
          )}
          {message.type === "success" && (
            <CheckCircle className="size-5 mt-0.5 flex-shrink-0" />
          )}
          {message.type === "info" && (
            <Info className="size-5 mt-0.5 flex-shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage({ text: "", type: "" })}
            className="text-white/50 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default Messages;
