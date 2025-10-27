"""FastAPI application for the EnhanceSound audio mastering service."""
from __future__ import annotations

import os
from pathlib import Path
from tempfile import NamedTemporaryFile, gettempdir
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from processor import AudioProcessor

app = FastAPI(title="EnhanceSound API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024
SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac"}

processor = AudioProcessor()


def _validate_upload(file: UploadFile) -> None:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file format.")


def _enforce_size_limit(data: bytes) -> None:
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 500MB limit.")


@app.post("/process-audio/", response_class=FileResponse)
async def process_audio(
    file: UploadFile = File(...),
    eq: Annotated[float, Form(ge=-1.0, le=1.0)] = 0.0,
    intensity: Annotated[float, Form(ge=0.0, le=1.0)] = 0.5,
) -> FileResponse:
    """Process an uploaded audio file with EQ and intensity adjustments."""
    _validate_upload(file)
    data = await file.read()
    _enforce_size_limit(data)

    with NamedTemporaryFile(delete=False, suffix=".wav") as temp_input:
        temp_input.write(data)
        temp_input.flush()
        temp_input.seek(0)
        processed = processor.process(temp_input, eq, intensity)

    with NamedTemporaryFile(delete=False, suffix=".wav") as temp_output:
        temp_output.write(processed)
        temp_output.flush()
        output_path = Path(temp_output.name)

    headers = {"Content-Disposition": f"attachment; filename=mastered-{Path(file.filename).stem}.wav"}
    return FileResponse(output_path, media_type="audio/wav", headers=headers)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("shutdown")
async def cleanup_temp_files() -> None:
    temp_dir = Path(gettempdir())
    for file_path in temp_dir.glob("tmp*.wav"):
        try:
            os.unlink(file_path)
        except OSError:
            continue
