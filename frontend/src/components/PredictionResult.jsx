import { CheckCircle2, CloudOff, Focus, History, RotateCcw, ScanSearch, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { getDiseaseName } from '../data/diseaseGuidance'
import DiseaseGuidance from './DiseaseGuidance'

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

function ConfidenceMeter({ label, value, icon: Icon }) {
  const percent = Math.round(value * 100)

  return (
    <div className="border-t border-ink/10 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-4 text-sm">
        <span className="flex items-center gap-2 text-ink/55"><Icon size={15} /> {label}</span>
        <span className="font-semibold text-ink">{formatPercent(value)}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
        <div className="h-full rounded-full bg-forest" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default function PredictionResult({ result, previewUrl, onReset }) {
  const { isAuthenticated } = useAuth()
  const healthy = result.disease === 'healthy'
  const box = result.boundingBox
  const imageSize = result.imageSize

  const overlay = box && imageSize ? {
    left: `${(box.x1 / imageSize.width) * 100}%`,
    top: `${(box.y1 / imageSize.height) * 100}%`,
    width: `${(box.width / imageSize.width) * 100}%`,
    height: `${(box.height / imageSize.height) * 100}%`,
  } : null

  return (
    <div className="space-y-8" aria-live="polite">
      {result.savedToHistory ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-forest/15 bg-[#edf3e6] px-4 py-3 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-sm text-forest"><CheckCircle2 size={17} /> This result is saved in your field journal.</span>
          <Link to="/history" className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"><History size={14} /> Open journal</Link>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-sm text-amber-900"><CloudOff size={17} /> {isAuthenticated ? (result.historySaveError || 'This result could not be saved.') : 'Guest results are not saved.'}</span>
          {!isAuthenticated && <Link to="/signup" className="text-xs font-semibold text-amber-900 hover:underline">Create an account for future scans</Link>}
        </div>
      )}
      <div className="grid overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-gentle lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="flex min-h-[330px] items-center justify-center bg-[#142d26] lg:min-h-[480px]">
          <div className="relative max-w-full">
            <img src={previewUrl} alt="Analyzed rice leaf" className="block max-h-[520px] max-w-full object-contain" />
            {overlay && (
              <div className="pointer-events-none absolute border border-[#d8ef98] shadow-[0_0_0_9999px_rgba(0,0,0,0.1)]" style={overlay}>
                <span className="absolute left-0 top-0 whitespace-nowrap bg-[#d8ef98] px-2 py-1 text-[10px] font-semibold text-ink">
                  Paddy leaf · {formatPercent(result.detectionConfidence)}
                </span>
              </div>
            )}
          </div>
        </div>

        <section className="flex flex-col p-6 sm:p-8 lg:p-10">
          <p className="eyebrow">Analysis result</p>
          <div className="mt-5 flex items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                {getDiseaseName(result.disease)}
              </h1>
              <p className="mt-2 text-sm leading-6 text-ink/50">
                {healthy
                  ? 'The leaf appears healthy based on the trained conditions.'
                  : 'The model found visual patterns associated with this condition.'}
              </p>
            </div>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${healthy ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {healthy ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}
            </span>
          </div>

          <div className="mt-7">
            <ConfidenceMeter label="Classification confidence" value={result.classificationConfidence} icon={ScanSearch} />
            {result.leafDetected && (
              <ConfidenceMeter label="Leaf detection confidence" value={result.detectionConfidence} icon={Focus} />
            )}
          </div>

          <p className="mt-auto pt-6 text-xs leading-5 text-ink/45">
            Use this result as a screening aid. Confirm treatment decisions with a qualified agricultural professional.
          </p>
          <button type="button" onClick={onReset} className="secondary-button mt-5 w-full">
            <RotateCcw size={16} /> Check another image
          </button>
        </section>

      </div>

      {!healthy && <DiseaseGuidance disease={result.disease} />}
    </div>
  )
}
