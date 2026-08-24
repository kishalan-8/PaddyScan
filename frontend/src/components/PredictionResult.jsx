import { CheckCircle2, CloudOff, Focus, History, Images, RotateCcw, ScanSearch, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { getDiseaseName } from '../data/diseaseGuidance'
import DiseaseGuidance from './DiseaseGuidance'

function formatPercent(value = 0) {
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

export default function PredictionResult({ result, previewUrls = [], onReset }) {
  const { isAuthenticated } = useAuth()
  const photos = useMemo(() => result.photos?.length ? result.photos : [{
    inputIndex: 0,
    accepted: true,
    disease: result.disease,
    classificationConfidence: result.classificationConfidence,
    detectionConfidence: result.detectionConfidence,
    boundingBox: result.boundingBox,
    imageSize: result.imageSize,
  }], [result])
  const [selectedIndex, setSelectedIndex] = useState(result.primaryPhotoIndex || 0)

  useEffect(() => {
    setSelectedIndex(result.primaryPhotoIndex || 0)
  }, [result])

  const selectedPhoto = photos.find((photo) => photo.inputIndex === selectedIndex) || photos[0]
  const selectedAsset = result.sourceImages?.find((asset) => asset.photoIndex === selectedPhoto.inputIndex)
  const selectedUrl = previewUrls[selectedPhoto.inputIndex] || selectedAsset?.secureUrl || result.originalImage?.secureUrl
  const healthy = result.disease === 'healthy'
  const box = selectedPhoto.accepted ? selectedPhoto.boundingBox : null
  const imageSize = selectedPhoto.accepted ? selectedPhoto.imageSize : null
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
          <span className="flex items-center gap-2 text-sm text-forest"><CheckCircle2 size={17} /> This field result and its photos are saved in your journal.</span>
          <Link to="/history" className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"><History size={14} /> Open journal</Link>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-sm text-amber-900"><CloudOff size={17} /> {isAuthenticated ? (result.historySaveError || 'This result could not be saved.') : 'Guest results are not saved.'}</span>
          {!isAuthenticated && <Link to="/signup" className="text-xs font-semibold text-amber-900 hover:underline">Create an account for future scans</Link>}
        </div>
      )}

      {result.rejectedPhotoCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 shrink-0" size={17} />
          <span>{result.rejectedPhotoCount} photo{result.rejectedPhotoCount === 1 ? ' was' : 's were'} excluded because a valid paddy leaf could not be confirmed.</span>
        </div>
      )}

      <div className="grid overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-gentle lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="bg-[#142d26]">
          <div className="flex min-h-[330px] items-center justify-center lg:min-h-[480px]">
            <div className="relative max-w-full">
              <img src={selectedUrl} alt={`Analyzed rice leaf ${selectedPhoto.inputIndex + 1}`} className="block max-h-[520px] max-w-full object-contain" />
              {overlay && (
                <div className="pointer-events-none absolute border border-[#d8ef98] shadow-[0_0_0_9999px_rgba(0,0,0,0.1)]" style={overlay}>
                  <span className="absolute left-0 top-0 whitespace-nowrap bg-[#d8ef98] px-2 py-1 text-[10px] font-semibold text-ink">
                    Paddy leaf · {formatPercent(selectedPhoto.detectionConfidence)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2 border-t border-white/10 p-3">
              {photos.map((photo) => {
                const asset = result.sourceImages?.find((item) => item.photoIndex === photo.inputIndex)
                const url = previewUrls[photo.inputIndex] || asset?.secureUrl
                return (
                  <button
                    type="button"
                    key={photo.inputIndex}
                    onClick={() => setSelectedIndex(photo.inputIndex)}
                    className={`relative overflow-hidden rounded-lg border-2 ${selectedPhoto.inputIndex === photo.inputIndex ? 'border-[#d8ef98]' : 'border-transparent opacity-65 hover:opacity-100'}`}
                    aria-label={`View photo ${photo.inputIndex + 1}`}
                  >
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                    <span className={`absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${photo.accepted ? 'bg-[#d8ef98] text-ink' : 'bg-amber-400 text-ink'}`}>
                      {photo.accepted ? photo.inputIndex + 1 : '!'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <section className="flex flex-col p-6 sm:p-8 lg:p-10">
          <p className="eyebrow">{result.isMultiPhoto ? 'Combined field diagnosis' : 'Analysis result'}</p>
          <div className="mt-5 flex items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{getDiseaseName(result.disease)}</h1>
              <p className="mt-2 text-sm leading-6 text-ink/50">
                {result.isMultiPhoto
                  ? `Combined from ${result.analyzedPhotoCount} valid leaf photos; ${result.consensusCount} produced this as their top result.`
                  : healthy
                    ? 'The leaf appears healthy based on the trained conditions.'
                    : 'The model found visual patterns associated with this condition.'}
              </p>
            </div>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${healthy ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {healthy ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}
            </span>
          </div>

          <div className="mt-7">
            <ConfidenceMeter label={result.isMultiPhoto ? 'Combined classification confidence' : 'Classification confidence'} value={result.classificationConfidence} icon={ScanSearch} />
            {result.isMultiPhoto && <ConfidenceMeter label="Photo consensus" value={result.consensusRatio} icon={Images} />}
            {result.leafDetected && <ConfidenceMeter label="Average leaf detection confidence" value={result.detectionConfidence} icon={Focus} />}
          </div>

          {photos.length > 1 && selectedPhoto.accepted && (
            <div className="mt-3 rounded-xl bg-ink/[0.045] p-3 text-xs text-ink/55">
              Photo {selectedPhoto.inputIndex + 1}: <strong className="text-ink">{getDiseaseName(selectedPhoto.disease)}</strong> · {formatPercent(selectedPhoto.classificationConfidence)}
            </div>
          )}
          {selectedPhoto.accepted === false && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{selectedPhoto.error}</div>
          )}

          <p className="mt-auto pt-6 text-xs leading-5 text-ink/45">Use this result as a screening aid. Confirm treatment decisions with a qualified agricultural professional.</p>
          <button type="button" onClick={onReset} className="secondary-button mt-5 w-full"><RotateCcw size={16} /> Start a new field check</button>
        </section>
      </div>

      {!healthy && <DiseaseGuidance disease={result.disease} />}
    </div>
  )
}
