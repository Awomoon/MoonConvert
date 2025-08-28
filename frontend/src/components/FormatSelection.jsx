import { useContext, useRef, useState } from "react";
import { FileContext } from "../context/fileContextInstance";
import {
  Check,
  ChevronDown,
  FileText,
  Image,
  Music,
  Search,
  Video,
} from "lucide-react";

const FormatSelection = () => {
  const dropdownRef = useRef(null);

  const { target, setTarget, supportedFormats } = useContext(FileContext);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleFormatSelect = (format) => {
    setTarget(format);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="mb-6">
      <p className="text-white font-semibold text-lg mb-2">Target Format</p>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 text-left text-white hover:bg-white/20 transition-all duration-200 flex justify-between items-center"
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

          <ChevronDown
            className={`size-5 ${
              isOpen ? "rotate-180" : ""
            } transition-transform duration-200`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-lg border-white/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-white/20">
              <div className="relative">
                <Search className="size-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search formats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {Object.entries(filteredFormats).length > 0 ? (
                Object.entries(filteredFormats).map(([category, formats]) => (
                  <div key={category} className="p-4">
                    <h4 className="text-white font-semibold mb-3 capitalize flex items-center">
                      {category === "audio" && (
                        <Music className="size-4 mr-2" />
                      )}
                      {category === "video" && (
                        <Video className="size-4 mr-2" />
                      )}
                      {category === "image" && (
                        <Image className="size-4 mr-2" />
                      )}
                      {category === "document" && (
                        <FileText className="size-4 mr-2" />
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
                          {target === format && <Check className="size-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
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
  );
};

export default FormatSelection;
