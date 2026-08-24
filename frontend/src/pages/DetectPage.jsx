import { AlertCircle, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import DropZone from '../components/DropZone'
import LoadingState from '../components/LoadingState'
import PredictionResult from '../components/PredictionResult'
import usePrediction from '../hooks/usePrediction'

export default function DetectPage() {
  const [selections, setSelections] = useState([])
  const previewUrls = useRef(new Set())
  const { result, error, isLoading, uploadProgress, analyze, reset, setError } = usePrediction()

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), [])

  function selectFiles(files) {
    const added = files.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)
      return { file, previewUrl }
    })
    setSelections((current) => [...current, ...added])
    setError('')
    reset()
  }

  function removeSelection(index) {
    setSelections((current) => {
      const removed = current[index]
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
        previewUrls.current.delete(removed.previewUrl)
      }
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
    setError('')
    reset()
  }

  function clearSelection() {
    selections.forEach(({ previewUrl }) => {
      URL.revokeObjectURL(previewUrl)
      previewUrls.current.delete(previewUrl)
    })
    setSelections([])
    reset()
  }

  function startOver() {
    clearSelection()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
      <div className="detect-wind" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        {!result && (
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow">Leaf check</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Inspect a rice leaf</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink/55 sm:text-base">
              Add up to five leaves from the same field. Each leaf is validated before a combined diagnosis is produced.
            </p>
          </div>
        )}

        {result ? (
          <PredictionResult result={result} previewUrls={selections.map((item) => item.previewUrl)} onReset={startOver} />
        ) : isLoading ? (
          <LoadingState uploadProgress={uploadProgress} />
        ) : (
          <>
            <DropZone
              selections={selections}
              onSelect={selectFiles}
              onRemove={removeSelection}
              onError={setError}
              disabled={isLoading}
            />

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-5 sm:flex-row">
              <p className="text-xs text-ink/50 sm:text-sm">
                {selections.length
                  ? `${selections.length} photo${selections.length === 1 ? '' : 's'} ready for analysis.`
                  : 'Select at least one photo to enable analysis.'}
              </p>
              <button
                type="button"
                onClick={() => selections.length && analyze(selections.map((item) => item.file))}
                disabled={!selections.length || isLoading}
                className="primary-button w-full disabled:cursor-not-allowed disabled:bg-ink/20 sm:w-auto"
              >
                Analyze {selections.length > 1 ? 'field photos' : 'photo'} <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
