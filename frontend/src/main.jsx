import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.jsx";
import { FileProvider } from "./context/fileContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FileProvider>
      <App />
      <Toaster richColors position="top-center" closeButton />
    </FileProvider>
  </StrictMode>
);
