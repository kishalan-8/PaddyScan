import axios from 'axios'
import { CheckCircle2, Eye, EyeOff, KeyRound, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resetAccountPassword } from '../services/auth'

function messageFor(error) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || 'Your password could not be reset.'
  return 'Your password could not be reset.'
}

export default function ResetPasswordPage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    if (token) window.history.replaceState(null, '', '/reset-password')
  }, [token])

  async function submit(event) {
    event.preventDefault()
    if (password !== confirmation) {
      setError('The password confirmation does not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetAccountPassword(token, password)
      setComplete(true)
    } catch (requestError) {
      setError(messageFor(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-shell grid min-h-[calc(100vh-129px)] place-items-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-lg rounded-[26px] border border-ink/10 bg-white/80 p-7 shadow-soft sm:p-10">
        {complete ? (
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-forest/10 text-forest"><CheckCircle2 size={27} /></span>
            <p className="eyebrow mt-7">Password updated</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Your account is secure again.</h1>
            <p className="mt-3 text-sm leading-6 text-ink/50">All previous refresh sessions have been signed out.</p>
            <Link to="/login" className="primary-button mt-7 w-full"><LogIn size={16} /> Sign in with new password</Link>
          </div>
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest/10 text-forest"><KeyRound size={23} /></span>
            <p className="eyebrow mt-7">Secure reset</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Choose a new password.</h1>
            <p className="mt-3 text-sm leading-6 text-ink/50">Use at least eight characters and avoid your previous password.</p>
            {!token ? (
              <div className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">This reset link does not contain a token. Request a new link.</div>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-4">
                <label className="auth-field">
                  <span>New password</span>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" maxLength="128" required autoComplete="new-password" placeholder="At least 8 characters" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </div>
                </label>
                <label className="auth-field">
                  <span>Confirm new password</span>
                  <input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength="8" maxLength="128" required autoComplete="new-password" placeholder="Repeat new password" />
                </label>
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
                <button type="submit" disabled={loading} className="primary-button w-full">{loading ? 'Updating password…' : 'Reset password'}</button>
              </form>
            )}
            <Link to="/forgot-password" className="mt-6 block text-center text-xs font-semibold text-forest hover:underline">Request another reset link</Link>
          </>
        )}
      </div>
    </section>
  )
}
