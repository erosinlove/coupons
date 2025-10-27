function AudioPlayer({ audioUrl, isProcessing }) {
  if (isProcessing) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-300">
        Rendering mastered preview…
      </div>
    )
  }

  if (!audioUrl) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-500">
        Upload a track to preview the mastered output.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-6">
      <audio controls src={audioUrl} className="w-full" />
      <a
        href={audioUrl}
        download="enhancesound-mastered.wav"
        className="inline-flex items-center justify-center rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
      >
        Download Mastered Track
      </a>
    </div>
  )
}

export default AudioPlayer
