import { ImagePlus, Plus, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_PHOTOS = 5

function validateFiles(files, currentCount) {
  if (currentCount + files.length > MAX_PHOTOS) return `Choose up to ${MAX_PHOTOS} photos per field check.`
  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: choose a JPEG, PNG, or WebP image.`
    if (file.size > MAX_FILE_SIZE) return `${file.name}: choose an image smaller than 10 MB.`
  }
  return ''
}

export default function DropZone({ selections, onSelect, onRemove, onError, disabled }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const canAdd = selections.length < MAX_PHOTOS

  function handleFiles(candidates) {
    if (!candidates?.length || disabled) return
    const files = Array.from(candidates)
    const validationError = validateFiles(files, selections.length)
    if (validationError) {
      onError(validationError)
      return
    }
    onSelect(files)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const picker = (
    <div
      role="button"
      tabIndex={disabled || !canAdd ? -1 : 0}
      aria-label="Upload rice leaf photos"
      onClick={() => !disabled && canAdd && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && canAdd && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled && canAdd) setIsDragging(true)
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
      } ${disabled || !canAdd ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled || !canAdd}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-forest/10 text-forest">
        {isDragging ? <ImagePlus size={24} /> : <UploadCloud size={24} />}
      </div>
      <h2 className="text-xl font-semibold sm:text-2xl">
        {isDragging ? 'Drop your photos here' : 'Add rice leaf photos'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">
        Select 1–5 clear photos from different leaves in the same field. A single photo still works.
      </p>
      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink/35">
        JPEG, PNG or WebP · 10 MB each · up to 5 photos
      </p>
    </div>
  )

  if (!selections.length) return picker

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/55 p-4 shadow-gentle sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Field photos</h2>
          <p className="mt-0.5 text-xs text-ink/45">{selections.length} of {MAX_PHOTOS} selected</p>
        </div>
        {canAdd && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="secondary-button px-3 py-2 text-xs">
            <Plus size={15} /> Add photos
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled || !canAdd}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {selections.map(({ file, previewUrl }, index) => (
          <article key={previewUrl} className="group relative overflow-hidden rounded-xl bg-[#142d26]">
            <img src={previewUrl} alt={`Selected rice leaf ${index + 1}`} className="aspect-square h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8 text-white">
              <p className="truncate text-[10px] font-medium">{file.name}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75 disabled:opacity-50"
              aria-label={`Remove ${file.name}`}
            >
              <X size={14} />
            </button>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-ink/45">For the strongest consensus, photograph separate leaves under similar lighting.</p>
    </div>
  )
}
