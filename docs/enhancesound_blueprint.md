# EnhanceSound Application Blueprint

## 1. Executive Summary
EnhanceSound is a local-first mastering assistant that delivers near real-time feedback for personal audio enhancement workflows. The product will launch as a desktop-friendly progressive web app running React on the client and FastAPI on the server. Audio files are processed locally with FFmpeg-backed transformations to maintain privacy and reduce latency while preserving a straightforward path toward a SaaS version. This document consolidates the system, business, engineering, and architectural viewpoints into a single actionable blueprint.

## 2. Personas & Use Cases
### 2.1 Primary Personas
- **Bedroom Producer (Hobbyist):** Wants quick polish on mixes without learning full DAW mastering chains.
- **Podcast Creator:** Needs consistent loudness and tone across episodes with minimal tooling.
- **Audiophile Tinkerer:** Experiments with tonal coloration and intensity, values export control.

### 2.2 Use Case Catalog
1. **Upload and Master:** User uploads WAV/MP3, tweaks EQ/Intensity, previews, and downloads mastered audio.
2. **Iterative Preview:** User adjusts sliders repeatedly and hears immediate results via streaming preview.
3. **Preset Recall (Future):** User selects a named preset to apply stored EQ/intensity curves.
4. **Session Continuity (Future SaaS):** Authenticated users revisit history of mastered tracks.

## 3. Requirements Breakdown
### 3.1 Functional Requirements
- Accept WAV/MP3 uploads up to 500 MB.
- Provide sliders for EQ (-1 to 1) and Intensity (0 to 1) with instant UI feedback.
- Submit processing requests to FastAPI backend and stream back mastered audio as WAV (48 kHz, 24-bit).
- Allow downloading the processed file and resetting the UI to default values.
- Manage temporary files on the server, removing them after delivery or expiry.

### 3.2 Non-Functional Requirements
- **Performance:** Round-trip processing target under 3 seconds for 5-minute track; preview updates within 1 second when parameters change.
- **Reliability:** Backend health endpoint for uptime monitoring; structured logging of processing jobs.
- **Security:** Validate MIME type/extension, limit file size, isolate temp directories, and configure CORS for localhost development domains.
- **Scalability:** Modularized processing pipeline that can be containerized; ready for horizontal scaling via Docker + cloud storage integration.
- **Usability:** Responsive UI, accessible slider controls (keyboard + screen readers), progress indication during processing.

### 3.3 Compliance & Licensing Considerations
- Verify FFmpeg redistribution requirements; bundle instructions for local installation.
- Provide disclaimer regarding user responsibility for copyrighted material.

## 4. System Architecture Overview
```
┌────────────────────┐       HTTPS        ┌─────────────────────┐
│ React Frontend      │  ──────────────▶  │ FastAPI Backend      │
│ (Vite + Tailwind)   │                   │ (Uvicorn + pydub)    │
│                    │ ◀──────────────   │                     │
└────────────────────┘     Audio Blob    └──────────┬──────────┘
                                                   │
                                                   ▼
                                          ┌───────────────────┐
                                          │ Audio Processor   │
                                          │ (FFmpeg filters)  │
                                          └───────────────────┘
```
- **Frontend:** SPA with componentized controls and audio player. Uses Fetch/Axios for multipart requests.
- **Backend:** FastAPI app with `/process-audio` endpoint orchestrating file IO and audio transforms.
- **Processing Module:** `processor.py` encapsulates EQ filtering, gain staging, and export logic using pydub and FFmpeg.
- **Storage:** Temporary directory per request; cleanup job scheduled after processing.

## 5. Detailed Component Design
### 5.1 Backend Modules
- `main.py`
  - FastAPI application factory
  - Routes: `/process-audio`, `/health`, `/version`
  - Middleware: CORS (localhost:5173), logging
- `processor.py`
  - `process_audio(file_path, eq_value, intensity_value)` returns processed file path
  - Helper functions: `apply_eq(audio_segment, eq_value)`, `apply_intensity(audio_segment, intensity_value)`
  - Utilizes high-pass or low-pass filters based on EQ sign and magnitude thresholds.
- `cleanup.py` (future)
  - Background task for removing expired temp files.

### 5.2 Frontend Components
- `FileUploader.jsx`: Drag-and-drop + fallback button; shows file metadata and validation errors.
- `EQSlider.jsx`: Range input with color-coded gradient; accessible labels and tooltip.
- `IntensitySlider.jsx`: Visual markers for “gentle” vs “punchy” zones.
- `AudioPlayer.jsx`: HTML5 audio element + waveform visualization (WaveSurfer optional); handles blob URL lifecycle.
- `ProcessingIndicator.jsx` (new): Displays spinner/progress and disable interactions during backend call.
- `App.jsx`: Manages global state (selected file, parameters, audio URL, loading status); debounces slider changes before calling backend.

### 5.3 API Contract
```
POST /process-audio
Headers: Content-Type: multipart/form-data
Body:
  file: UploadFile (WAV or MP3)
  eq: float [-1.0, 1.0]
  intensity: float [0.0, 1.0]
Responses:
  200: audio/wav binary stream (mastered)
  400: validation error details
  413: payload too large
  500: processing failure log reference
```
Additional endpoints:
- `GET /health`: returns `{status:"ok"}`.
- `GET /version`: returns semantic version and build metadata.

## 6. Audio Processing Logic
- **EQ Interpretation:**
  - `eq >= 0`: high-pass filter between 3–5 kHz with gain boosting on high frequencies.
  - `eq < 0`: low-pass filter between 500–1,000 Hz with gentle shelving to warm tone.
  - Implement using pydub filters and dynamic range calculation to scale frequency cutoff.
- **Intensity Gain:**
  - Linear mapping: `gain_db = 5 * intensity` applied via `audio_segment + gain_db`.
  - Optional soft-clipping or limiter for values above 0.8 to prevent distortion.
- **Export:**
  - Convert to 48 kHz sample rate, 24-bit depth WAV. Provide fallback when FFmpeg missing.

## 7. Data Flow & State Management
1. User selects file → `FileUploader` stores `File` in state.
2. `App` composes `FormData` with current sliders and file.
3. Backend receives upload, persists to temp path, and calls `processor.process_audio`.
4. Processed file stored in temp dir; response streams file as `FileResponse`.
5. Frontend converts blob to object URL, updates `AudioPlayer`. Clean up previous blob URLs to avoid memory leaks.
6. Optional: Save last-used parameters in `localStorage` for UX continuity.

## 8. DevOps & Local Development
- **Backend Dev:** `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Frontend Dev:** `npm run dev` (Vite default port 5173)
- **Environment Variables:** `.env` for FFmpeg binary path, max upload size, log level.
- **Testing:**
  - Backend: pytest with FastAPI test client + audio fixtures.
  - Frontend: React Testing Library for component behavior, Playwright for e2e preview workflow.
- **Containerization (Future):** Dockerfile per service; docker-compose for local orchestration with shared volume for temp files.

## 9. Roadmap & Milestones
1. **Milestone 1 – Foundation (Week 1):** Scaffold frontend (Vite + Tailwind), scaffold FastAPI backend, implement `/health`.
2. **Milestone 2 – Core Mastering (Week 2):** Implement upload + processing pipeline, integrate sliders with API, enable download.
3. **Milestone 3 – UX Polish (Week 3):** Add waveform visualization, loading states, error handling, tests.
4. **Milestone 4 – SaaS Prep (Week 4+):** Add presets, authentication groundwork, Dockerization, storage abstraction.

## 10. Risks & Mitigations
- **FFmpeg Availability:** Document installation, provide setup script, detect missing dependency and show actionable error.
- **Large File Handling:** Stream uploads and responses, limit concurrency, consider chunked uploads in SaaS phase.
- **Audio Artifacts:** Implement limiter and provide bypass toggle; include QA checklist with reference tracks.
- **Privacy Concerns:** Clarify local-first processing in onboarding; for SaaS, ensure encryption and retention policy.

## 11. Success Metrics
- Upload-to-preview cycle time under 4 seconds for 5-minute track on mid-tier laptop.
- At least 90% of beta users successfully master and download within first session.
- Less than 2% error rate in processing pipeline during alpha testing.

## 12. Open Questions
- Do we need multi-band EQ or presets at MVP launch?
- Should intensity slider also control compression/limiting or purely gain?
- What level of offline capability is required (PWA caching for replays)?

## 13. Recommendations & Next Steps
- Validate MVP with 3–5 target users (bedroom producers/podcasters).
- Prioritize automated tests around `/process-audio` to catch regressions.
- Begin design exploration for preset system to enable future subscription upsell.
- Explore licensing and usage policy to avoid legal issues.

---
Prepared collaboratively by the System Analyst, Business Analyst, Sound Engineer, Full-Stack Engineer, and Architecture Mentor roles.
