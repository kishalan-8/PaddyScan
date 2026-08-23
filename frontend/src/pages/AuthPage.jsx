import axios from 'axios'
import { ArrowRight, Check, Eye, EyeOff, Leaf, LockKeyhole, Sprout } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth-context'

function errorMessage(error) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (!error.response) return 'The server could not be reached. Make sure FastAPI is running.'
  }
  return 'Your account request could not be completed.'
}

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { isAuthenticated, login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    farmName: '',
    district: '',
  })

  if (isAuthenticated) return <Navigate to="/history" replace />

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (isSignup) await signup(form)
      else await login({ email: form.email, password: form.password })
      navigate(location.state?.from?.pathname || (isSignup ? '/detect' : '/history'), { replace: true })
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-shell px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-ink/10 bg-white/75 shadow-soft lg:grid-cols-[0.88fr_1.12fr]">
        <div className="auth-story relative hidden min-h-[650px] overflow-hidden p-10 text-white lg:flex lg:flex-col">
          <div className="auth-glow" />
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10">
            <Sprout size={21} />
          </span>
          <div className="relative mt-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#dceca0]">Your field memory</p>
            <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-[1.06] tracking-[-0.045em]">
              Every leaf tells part of the season.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
              Keep scans, visual evidence, and farmer observations together so changes are easier to follow.
            </p>
            <div className="mt-8 grid gap-3 text-xs text-white/70">
              {['Private detection history', 'Images stored with each result', 'Field notes that stay editable'].map((item) => (
                <span key={item} className="flex items-center gap-2.5">
                  <Check className="text-[#dceca0]" size={15} /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mx-auto max-w-md">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest/10 text-forest lg:hidden">
              <Leaf size={20} />
            </span>
            <p className="eyebrow mt-7 lg:mt-0">{isSignup ? 'Create your journal' : 'Welcome back'}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {isSignup ? 'Start remembering every scan.' : 'Return to your fields.'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/50">
              {isSignup ? 'A free account saves future detections and observations.' : 'Sign in to review detections and farmer notes.'}
            </p>

            <form className="mt-8 space-y-4" onSubmit={submit}>
              {isSignup && (
                <label className="auth-field">
                  <span>Full name</span>
                  <input name="fullName" value={form.fullName} onChange={updateField} required minLength="2" autoComplete="name" placeholder="Your name" />
                </label>
              )}
              <label className="auth-field">
                <span>Email address</span>
                <input name="email" value={form.email} onChange={updateField} required type="email" autoComplete="email" placeholder="farmer@example.com" />
              </label>
              <label className="auth-field">
                <span className="flex items-center justify-between">
                  Password
                  {!isSignup && <Link to="/forgot-password" className="font-semibold text-forest hover:underline">Forgot password?</Link>}
                </span>
                <div className="relative">
                  <input
                    className="pr-12"
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    required
                    minLength={isSignup ? 8 : 1}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {isSignup && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="auth-field">
                    <span>Farm name <small>optional</small></span>
                    <input name="farmName" value={form.farmName} onChange={updateField} autoComplete="organization" placeholder="Green Acres" />
                  </label>
                  <label className="auth-field">
                    <span>District <small>optional</small></span>
                    <input name="district" value={form.district} onChange={updateField} placeholder="Kurunegala" />
                  </label>
                </div>
              )}

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</div>}

              <button className="primary-button mt-2 w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : isSignup ? 'Create free account' : 'Sign in'}
                {!isSubmitting && <ArrowRight size={17} />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink/50">
              {isSignup ? 'Already have an account?' : 'New to PaddyScan?'}{' '}
              <Link className="font-semibold text-forest hover:underline" to={isSignup ? '/login' : '/signup'}>
                {isSignup ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
            <p className="mt-7 flex items-center justify-center gap-2 border-t border-ink/10 pt-5 text-[11px] text-ink/35">
              <LockKeyhole size={13} /> Passwords are securely hashed before storage
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
