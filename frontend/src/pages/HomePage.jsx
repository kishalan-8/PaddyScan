import { ArrowRight, Camera, Cpu, ScanSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import PaddyField from '../components/PaddyField'

const steps = [
  { icon: Camera, number: '01', title: 'Upload', copy: 'Choose a clear photo of a rice leaf from your device.' },
  { icon: ScanSearch, number: '02', title: 'Validate', copy: 'The detector checks that a paddy leaf is visible and in focus.' },
  { icon: Cpu, number: '03', title: 'Understand', copy: 'The classifier names the condition and reports its confidence.' },
]

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
          <div className="relative z-10 max-w-xl">
            <p className="eyebrow">Rice leaf analysis</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-ink sm:text-5xl lg:text-[3.25rem]">
              Understand what your paddy leaves are telling you.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink/60 sm:text-lg">
              Upload a clear photo to screen for common rice leaf diseases and receive a confidence-scored result.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/detect" className="primary-button">
                Check a leaf <ArrowRight size={17} />
              </Link>
              <a href="#how-it-works" className="secondary-button">
                How it works
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/10 pt-5 text-xs text-ink/50">
              <span>9 trained conditions</span>
              <span>Leaf-first validation</span>
              <span>Field guidance</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <PaddyField />
            <div className="field-caption">
              <span className="field-caption-dot" />
              Calm fields start with early observation
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-ink/10 bg-white/55 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">One photo. A clear result.</h2>
            <p className="mt-3 leading-7 text-ink/55">The model validates the leaf before it attempts to name a condition.</p>
          </div>
          <div className="mt-10 grid border-y border-ink/10 md:grid-cols-3">
            {steps.map(({ icon: Icon, number, title, copy }) => (
              <article key={title} className="border-b border-ink/10 py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                <div className="flex items-center justify-between">
                  <Icon className="text-forest" size={20} strokeWidth={1.8} />
                  <span className="text-xs font-semibold tracking-[0.15em] text-ink/30">{number}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/55">{copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-7 max-w-3xl text-xs leading-5 text-ink/45">
            This tool provides model predictions for screening support. Confirm important crop-management decisions with a qualified agricultural professional.
          </p>
        </div>
      </section>
    </>
  )
}
