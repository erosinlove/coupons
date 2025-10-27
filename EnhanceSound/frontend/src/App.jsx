import { useCallback, useEffect, useMemo, useState } from 'react'
import EQSlider from './components/EQSlider'
import IntensitySlider from './components/IntensitySlider'
import FileUploader from './components/FileUploader'
import AudioPlayer from './components/AudioPlayer'

const API_URL = 'http://localhost:8000/process-audio/'

const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

function App() {
  const [file, setFile] = useState(null)
  const [eq, setEq] = useState(0)
  const [intensity, setIntensity] = useState(0.4)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const debouncedEq = useDebounce(eq)
  const debouncedIntensity = useDebounce(intensity)

  const canProcess = useMemo(() => Boolean(file), [file])

  const revokeUrl = useCallback(() => {
    setAudioUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return null
    })
  }, [])

  const handleFileSelect = useCallback((selected) => {
    setFile(selected)
    setError(null)
    revokeUrl()
  }, [revokeUrl])

  useEffect(() => {
    if (!canProcess) return

    const controller = new AbortController()
    const processAudio = async () => {
      try {
        setIsProcessing(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('eq', debouncedEq)
        formData.append('intensity', debouncedIntensity)

        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || 'Failed to process audio')
        }

        const blob = await response.blob()
        revokeUrl()
        setAudioUrl(URL.createObjectURL(blob))
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setIsProcessing(false)
      }
    }

    processAudio()
    return () => controller.abort()
  }, [file, debouncedEq, debouncedIntensity, canProcess, revokeUrl])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold text-white">EnhanceSound</h1>
          <p className="text-sm text-slate-400">Personal audio mastering toolkit</p>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <section className="grid gap-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <FileUploader onFileSelect={handleFileSelect} isProcessing={isProcessing} />

          <div className="grid gap-4 md:grid-cols-2">
            <EQSlider value={eq} onChange={setEq} disabled={!canProcess || isProcessing} />
            <IntensitySlider value={intensity} onChange={setIntensity} disabled={!canProcess || isProcessing} />
          </div>

          {error && (
            <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-rose-200">
              {error}
            </p>
          )}

          <AudioPlayer audioUrl={audioUrl} isProcessing={isProcessing} />
        </section>

        <section className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">How it works</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-slate-300">
            <li>Upload a WAV or MP3 file from your library.</li>
            <li>Adjust the EQ slider to move between warmer and brighter tones.</li>
            <li>Increase intensity to add tasteful gain to the mastered output.</li>
            <li>Preview the mastered result instantly and download it locally.</li>
          </ol>
        </section>
      </main>
    </div>
  )
}

export default App
