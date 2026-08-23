import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="grid min-h-[65vh] place-items-center px-5 text-center">
      <div>
        <p className="eyebrow">404 · Page not found</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">This page has not taken root.</h1>
        <Link to="/" className="primary-button mt-7">
          <ArrowLeft size={17} /> Back home
        </Link>
      </div>
    </section>
  )
}
