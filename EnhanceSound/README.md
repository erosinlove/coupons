# EnhanceSound

EnhanceSound is a local-first mastering playground. Users can upload an audio file, tweak EQ and intensity, preview the mastered render, and download the processed result. The project ships with a FastAPI backend and a React (Vite + Tailwind) frontend.

## Project structure

```
EnhanceSound/
├── backend/
│   ├── main.py
│   ├── processor.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── AudioPlayer.jsx
        │   ├── EQSlider.jsx
        │   ├── FileUploader.jsx
        │   └── IntensitySlider.jsx
        ├── main.jsx
        └── styles.css
```

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API exposes:

- `POST /process-audio/` – accepts a file, `eq` (-1 to 1) and `intensity` (0 to 1) form fields. Returns a mastered WAV file.
- `GET /health` – simple readiness check.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend to run on `http://localhost:8000` and makes cross-origin requests from `http://localhost:5173`.

## Notes

- Processing uses [pydub](https://github.com/jiaaro/pydub) filters and gain adjustments.
- Files are limited to 500 MB and the backend cleans up temporary renders on shutdown.
- Output is exported as a 48 kHz WAV file for consistent playback.
