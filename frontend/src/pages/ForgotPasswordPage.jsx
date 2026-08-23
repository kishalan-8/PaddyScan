import axios from 'axios'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, TerminalSquare } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../services/auth'

function messageFor(error) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || 'The reset request could not be completed.'
  return 'The reset request could not be completed.'
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState('email')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await requestPasswordReset(email)
      setDeliveryMode(result.deliveryMode || 'email')
      setSent(true)
    } catch (requestError) {
      setError(messageFor(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-shell grid min-h-[calc(100vh-129px)] place-items-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-lg rounded-[26px] border border-ink/10 bg-white/80 p-7 shadow-soft sm:p-10">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-forest/10 text-forest"><CheckCircle2 size={27} /></span>
            <p className="eyebrow mt-7">Reset requested</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{deliveryMode === 'email' ? 'Check your inbox.' : 'Check the FastAPI terminal.'}</h1>
            <p className="mt-3 text-sm leading-6 text-ink/50">
              {deliveryMode === 'email'
                ? 'If an account uses that email, a single-use reset link will arrive shortly. It expires after 20 minutes.'
                : 'SMTP is not configured yet. If an account uses that email, a local reset link has been printed in the backend terminal.'}
            </p>
            {deliveryMode === 'console' && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-5 text-amber-900">
                <TerminalSquare className="mt-0.5 shrink-0" size={17} />
                Add the Gmail App Password to SMTP_PASSWORD to switch delivery to email.
              </div>
            )}
            {deliveryMode === 'email' && <p className="mt-5 text-xs text-ink/40">Also check the spam or promotions folder if it does not appear.</p>}
            <Link to="/login" className="secondary-button mt-7 w-full"><ArrowLeft size={16} /> Return to sign in</Link>
          </div>
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest/10 text-forest"><KeyRound size={23} /></span>
            <p className="eyebrow mt-7">Account recovery</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Forgot your password?</h1>
            <p className="mt-3 text-sm leading-6 text-ink/50">Enter the address used for your PaddyScan account.</p>
            <form onSubmit={submit} className="mt-8">
              <label className="auth-field">
                <span>Email address</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="farmer@example.com" />
              </label>
              {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
              <button type="submit" disabled={loading} className="primary-button mt-5 w-full">{loading ? 'Creating reset link…' : 'Continue'} {!loading && <ArrowRight size={16} />}</button>
            </form>
            <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-ink/45 hover:text-forest"><ArrowLeft size={14} /> Back to sign in</Link>
          </>
        )}
      </div>
    </section>
  )
}
