import { CloudSun, ExternalLink, Leaf, ShieldCheck, Stethoscope } from 'lucide-react'
import { DISEASE_GUIDANCE } from '../data/diseaseGuidance'

const SECTIONS = [
  { key: 'affected', title: 'Plant parts and life stages affected', icon: Leaf },
  { key: 'symptoms', title: 'Symptoms', icon: Stethoscope },
  { key: 'conditions', title: 'Conditions that favour the disease', icon: CloudSun },
  { key: 'management', title: 'Disease management', icon: ShieldCheck },
]

export default function DiseaseGuidance({ disease }) {
  const guidance = DISEASE_GUIDANCE[disease]
  if (!guidance) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white/65 shadow-gentle">
      <div className="border-b border-ink/10 bg-[#edf3e6] px-6 py-6 sm:px-8">
        <p className="eyebrow">Field guidance</p>
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">About {guidance.name}</h2>
            <p className="mt-2 text-sm italic text-ink/55">{guidance.cause}</p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-forest/60">Sri Lanka field context</span>
        </div>
        {guidance.note && (
          <p className="mt-5 max-w-4xl rounded-xl border border-amber-900/10 bg-amber-50/80 px-4 py-3 text-xs leading-5 text-amber-950/75">
            {guidance.note}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2">
        {SECTIONS.map(({ key, title, icon: Icon }, index) => (
          <article
            key={key}
            className={`p-6 sm:p-8 ${index < 3 ? 'border-b border-ink/10' : ''} ${index < 2 ? 'md:border-b' : 'md:border-b-0'} ${index % 2 === 0 ? 'md:border-r md:border-ink/10' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest"><Icon size={17} /></span>
              <h3 className="text-sm font-semibold leading-5 tracking-[-0.01em]">{title}</h3>
            </div>
            <ul className="mt-5 space-y-3">
              {guidance[key].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-ink/60">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-leaf/70" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <footer className="flex flex-col justify-between gap-4 border-t border-ink/10 bg-ink/[0.025] px-6 py-5 sm:flex-row sm:items-center sm:px-8">
        <p className="max-w-2xl text-[11px] leading-5 text-ink/45">
          Guidance supports field screening, not a confirmed diagnosis. Before using any pesticide, verify current Sri Lankan registration, follow the product label, and consult an agricultural officer.
        </p>
        <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-2">
          {guidance.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-forest hover:underline">
              {source.label} <ExternalLink size={12} />
            </a>
          ))}
        </div>
      </footer>
    </section>
  )
}
