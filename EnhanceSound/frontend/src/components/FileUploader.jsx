const ACCEPTED_TYPES = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac']

function FileUploader({ onFileSelect, isProcessing }) {
  const handleChange = (event) => {
    const [file] = event.target.files
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
      <p className="text-sm text-slate-300">
        Drag and drop your audio file here or click to browse (WAV, MP3, OGG, FLAC)
      </p>
      <label className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:opacity-90">
        <span>{isProcessing ? 'Processing…' : 'Select Audio'}</span>
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handleChange}
          disabled={isProcessing}
        />
      </label>
    </div>
  )
}

export default FileUploader
