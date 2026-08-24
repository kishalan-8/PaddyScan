import { ScanLine } from 'lucide-react'

export default function LoadingState({ uploadProgress }) {
  const stage = uploadProgress < 100 ? 'Uploading field photos' : 'Validating leaves and combining results'

  return (
    <div className="rounded-2xl border border-forest/15 bg-white/70 px-6 py-10 text-center shadow-gentle sm:px-10">
      <div className="relative mx-auto mb-5 h-16 w-16 overflow-hidden rounded-full bg-forest/10 text-forest">
        <ScanLine className="absolute inset-0 m-auto" size={25} />
        <div className="scan-line absolute inset-x-2 top-0 h-px bg-forest shadow-[0_0_10px_rgba(40,93,69,0.6)]" />
      </div>
      <h2 className="text-xl font-semibold">Reading your field photos</h2>
      <p className="mt-2 text-sm text-ink/50">{stage}<span className="loading-dot">.</span><span className="loading-dot">.</span><span className="loading-dot">.</span></p>
      <div className="mx-auto mt-6 h-1 max-w-sm overflow-hidden rounded-full bg-forest/10">
        <div
          className={`h-full rounded-full bg-forest transition-all duration-500 ${uploadProgress >= 100 ? 'w-full animate-pulse' : ''}`}
          style={uploadProgress < 100 ? { width: `${uploadProgress}%` } : undefined}
        />
      </div>
    </div>
  )
}
