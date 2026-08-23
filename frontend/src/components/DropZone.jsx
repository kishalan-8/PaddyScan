import { ImagePlus, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Choose a JPEG, PNG, or WebP image.'
  if (file.size > MAX_FILE_SIZE) return 'Choose an image smaller than 10 MB.'
  return ''
}

export default function DropZone({ file, previewUrl, onSelect, onClear, onError, disabled }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(candidate) {
    if (!candidate || disabled) return
    const validationError = validateFile(candidate)
    if (validationError) {
      onError(validationError)
      return
    }
    onSelect(candidate)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  if (file && previewUrl) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-ink shadow-gentle">
        <img src={previewUrl} alt="Selected rice leaf" className="h-[320px] w-full object-contain sm:h-[420px]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 text-white sm:p-7">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="mt-0.5 text-xs text-white/65">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Remove selected image"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload a rice leaf image"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false)
      }}
      onDrop={handleDrop}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border border-dashed p-8 text-center transition sm:p-11 ${
        isDragging
          ? 'border-leaf bg-leaf/10'
          : 'border-ink/20 bg-white/55 hover:border-leaf/70 hover:bg-white/80'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-forest/10 text-forest">
        {isDragging ? <ImagePlus size={24} /> : <UploadCloud size={24} />}
      </div>
      <h2 className="text-xl font-semibold sm:text-2xl">
        {isDragging ? 'Drop your image here' : 'Add a clear leaf photo'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">
        Drag and drop an image, or <span className="font-medium text-forest">browse your files</span>.
        Use even light and keep the leaf in focus.
      </p>
      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink/35">
        JPEG, PNG or WebP · up to 10 MB
      </p>
    </div>
  )
}
