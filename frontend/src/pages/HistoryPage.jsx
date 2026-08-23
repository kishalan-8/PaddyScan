import axios from 'axios'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageOff,
  Leaf,
  MessageSquarePlus,
  Pencil,
  Plus,
  Save,
  ScanSearch,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDiseaseName } from '../data/diseaseGuidance'
import { addFarmerNote, deleteDetection, deleteFarmerNote, getHistory, updateFarmerNote } from '../services/history'

function formatDate(value, withTime = false) {
  return new Intl.DateTimeFormat('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

function requestError(error) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || 'The field journal could not be updated.'
  return 'The field journal could not be updated.'
}

function EmptyJournal() {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-[24px] border border-dashed border-ink/15 bg-white/45 p-8 text-center">
      <div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-forest/10 text-forest"><Leaf size={27} /></span>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">Your journal is ready.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/50">Analyze your first rice leaf while signed in and the full result will appear here automatically.</p>
        <Link to="/detect" className="primary-button mt-6">Scan a leaf <Plus size={16} /></Link>
      </div>
    </div>
  )
}

function HistoryCard({ item, active, onClick }) {
  const image = item.originalImage?.secureUrl
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group overflow-hidden rounded-[20px] border text-left transition-all ${active ? 'border-forest bg-white shadow-gentle' : 'border-ink/10 bg-white/65 hover:-translate-y-0.5 hover:border-forest/30 hover:bg-white'}`}
    >
      <div className="relative aspect-[1.55] overflow-hidden bg-[#18352d]">
        {image ? <img src={image} alt="Stored rice leaf" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <ImageOff className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30" />}
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${item.disease === 'healthy' ? 'bg-[#dceca0] text-ink' : 'bg-[#fff2cb] text-[#76501d]'}`}>
          {Math.round(item.classificationConfidence * 100)}% match
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-semibold tracking-[-0.015em]">{getDiseaseName(item.disease)}</h3>
        <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-ink/40">
          <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {formatDate(item.createdAt)}</span>
          <span className="flex items-center gap-1.5"><FileText size={12} /> {item.notes?.length || 0} notes</span>
        </div>
      </div>
    </button>
  )
}

function NoteEditor({ note, onSave, onCancel }) {
  const [text, setText] = useState(note?.text || '')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    try { await onSave(text.trim()) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-forest/20 bg-[#f3f6ed] p-4">
      <textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} maxLength="2000" rows="4" placeholder="What did you observe in the field?" className="w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-ink/30" />
      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
        <span className="text-[10px] text-ink/35">{text.length}/2000</span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-xs font-semibold text-ink/50 hover:bg-white">Cancel</button>
          <button type="submit" disabled={saving || !text.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Save size={13} /> {saving ? 'Saving…' : 'Save note'}</button>
        </div>
      </div>
    </form>
  )
}

function DetectionDetail({ item, onClose, onDelete, onChange }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  async function addNote(text) {
    try {
      const note = await addFarmerNote(item.id, text)
      onChange({ ...item, notes: [...(item.notes || []), note] })
      setAdding(false)
    } catch (err) { setError(requestError(err)) }
  }

  async function editNote(noteId, text) {
    try {
      const updated = await updateFarmerNote(item.id, noteId, text)
      onChange({ ...item, notes: item.notes.map((note) => (note.id === noteId ? { ...note, ...updated } : note)) })
      setEditingId(null)
    } catch (err) { setError(requestError(err)) }
  }

  async function removeNote(noteId) {
    if (!window.confirm('Delete this farmer note?')) return
    try {
      await deleteFarmerNote(item.id, noteId)
      onChange({ ...item, notes: item.notes.filter((note) => note.id !== noteId) })
    } catch (err) { setError(requestError(err)) }
  }

  return (
    <aside className="history-detail lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <div className="flex items-start justify-between gap-5 border-b border-white/10 p-5 sm:p-6">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#dceca0]">Detection record</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">{getDiseaseName(item.disease)}</h2>
          <p className="mt-1 text-xs text-white/40">{formatDate(item.createdAt, true)}</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close details"><X size={17} /></button>
      </div>

      <div className="p-5 sm:p-6">
        <div className="overflow-hidden rounded-2xl bg-black/15">
          <img src={item.originalImage?.secureUrl} alt="Stored leaf" className="max-h-72 w-full object-contain" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
            <span className="text-[9px] uppercase tracking-[0.11em] text-white/35">Disease confidence</span>
            <strong className="mt-1 block text-lg font-semibold text-white">{(item.classificationConfidence * 100).toFixed(1)}%</strong>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
            <span className="text-[9px] uppercase tracking-[0.11em] text-white/35">Leaf confidence</span>
            <strong className="mt-1 block text-lg font-semibold text-white">{(item.detectionConfidence * 100).toFixed(1)}%</strong>
          </div>
        </div>

        <div className="mt-7 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#dceca0]">Farmer notes</p>
              <p className="mt-1 text-xs text-white/40">Observations from this scan</p>
            </div>
            {!adding && <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"><MessageSquarePlus size={14} /> Add</button>}
          </div>

          {error && <div className="mt-4 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-xs text-red-100">{error}</div>}
          {adding && <div className="mt-4"><NoteEditor onSave={addNote} onCancel={() => setAdding(false)} /></div>}

          <div className="mt-4 grid gap-3">
            {!item.notes?.length && !adding && (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs leading-5 text-white/35">No observations yet. Add symptoms, field location, or treatment details.</div>
            )}
            {item.notes?.map((note) => editingId === note.id ? (
              <NoteEditor key={note.id} note={note} onSave={(text) => editNote(note.id, text)} onCancel={() => setEditingId(null)} />
            ) : (
              <article key={note.id} className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/75">{note.text}</p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <time className="text-[9px] text-white/30">{formatDate(note.updatedAt, true)}</time>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditingId(note.id)} className="grid h-7 w-7 place-items-center rounded-md text-white/35 hover:bg-white/10 hover:text-white" aria-label="Edit note"><Pencil size={12} /></button>
                    <button type="button" onClick={() => removeNote(note.id)} className="grid h-7 w-7 place-items-center rounded-md text-white/35 hover:bg-red-300/10 hover:text-red-200" aria-label="Delete note"><Trash2 size={12} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button type="button" onClick={() => onDelete(item.id)} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/15 px-4 py-3 text-xs font-semibold text-red-100/70 hover:bg-red-300/10 hover:text-red-100"><Trash2 size={14} /> Delete this detection</button>
      </div>
    </aside>
  )
}

export default function HistoryPage() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 })
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selected = useMemo(() => data.items.find((item) => item.id === selectedId), [data.items, selectedId])

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const result = await getHistory(page)
      setData(result)
      setSelectedId((current) => result.items.some((item) => item.id === current) ? current : null)
    } catch (err) { setError(requestError(err)) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function changeItem(updated) {
    setData((current) => ({ ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) }))
  }

  async function removeItem(id) {
    if (!window.confirm('Delete this detection, all its notes, and stored images?')) return
    try {
      await deleteDetection(id)
      setSelectedId(null)
      await load(data.page)
    } catch (err) { setError(requestError(err)) }
  }

  return (
    <section className="journal-page px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Field journal</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">A season, remembered.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink/50">Review saved leaf detections and keep observations connected to the evidence.</p>
          </div>
          <div className="flex items-center gap-3">
            
            <Link to="/detect" className="primary-button"><ScanSearch size={16} /> New scan</Link>
          </div>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {loading ? (
          <div className="grid min-h-[400px] place-items-center"><span className="h-10 w-10 animate-spin rounded-full border-2 border-forest/20 border-t-forest" /></div>
        ) : data.total === 0 ? <EmptyJournal /> : (
          <div className={`grid items-start gap-5 ${selected ? 'lg:grid-cols-[minmax(0,1fr)_430px]' : ''}`}>
            <div>
              {selected && <button type="button" onClick={() => setSelectedId(null)} className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-forest lg:hidden"><ArrowLeft size={14} /> Back to journal</button>}
              <div className={`grid gap-4 ${selected ? 'hidden sm:grid-cols-2 lg:grid' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {data.items.map((item) => <HistoryCard key={item.id} item={item} active={selectedId === item.id} onClick={() => setSelectedId(item.id)} />)}
              </div>

              {data.pages > 1 && !selected && (
                <div className="mt-7 flex items-center justify-center gap-3">
                  <button type="button" disabled={data.page === 1} onClick={() => load(data.page - 1)} className="secondary-button px-3 disabled:opacity-35"><ChevronLeft size={16} /></button>
                  <span className="text-xs text-ink/45">Page {data.page} of {data.pages}</span>
                  <button type="button" disabled={data.page === data.pages} onClick={() => load(data.page + 1)} className="secondary-button px-3 disabled:opacity-35"><ChevronRight size={16} /></button>
                </div>
              )}
            </div>
            {selected && <DetectionDetail item={selected} onClose={() => setSelectedId(null)} onDelete={removeItem} onChange={changeItem} />}
          </div>
        )}
      </div>
    </section>
  )
}
