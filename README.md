# File Converter App (React frontend + Node backend)

This repository contains:
- `backend/` — Express server handling file uploads and conversions using `sharp`, `fluent-ffmpeg`, and `libreoffice-convert`.
- `frontend/` — Minimal React (Vite) app to upload files and request conversions.

## Features
- Image conversions (png, jpeg, webp, avif) via `sharp`.
- Audio & video conversions (mp3, wav, mp4, webm, ogg, etc.) via `ffmpeg`.
- Document conversions (docx, odt, pptx -> pdf, etc.) via LibreOffice (requires `libreoffice` CLI installed).

## Requirements (system)
- Node.js 18+ and npm
- **ffmpeg** installed and in PATH (for audio/video)
- **LibreOffice** installed and in PATH (for document conversions)

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y ffmpeg libreoffice
```

On macOS:
```bash
brew install ffmpeg
brew install --cask libreoffice
```

On Windows:
- Install FFmpeg and add to PATH.
- Install LibreOffice and add soffice.exe location to PATH.

## Setup

### Backend
```bash
cd backend
npm install
# start server
npm start
# server runs at http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173 (vite default) or as printed by Vite
```

## Usage
1. Start backend (`npm start` in backend).
2. Start frontend (`npm run dev` in frontend).
3. In the frontend choose a file and type a target extension (e.g. `mp3`, `mp4`, `webp`, `png`, `pdf`) and click Convert.
4. When conversion completes, click **Download converted file**.

## Notes & Troubleshooting
- If conversion fails for certain formats: check that `ffmpeg` or `libreoffice` is properly installed and reachable from the server process.
- Security: This example stores uploads in `backend/uploads` and immediately returns converted file. For production, add authentication, validation, rate limiting, and garbage collection of temp files.
- For advanced document conversions you may need specific LibreOffice filters; consult `libreoffice-convert` docs.

## Improvements you can request
- Add progress reporting from server during ffmpeg conversion.
- Add queueing & concurrency control.
- Add drag-and-drop and supported-format dropdown.
- Add S3/Cloud upload and signed URL downloads.