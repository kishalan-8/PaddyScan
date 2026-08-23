import axios from 'axios'
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Pencil,
  Save,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/auth-context'

function messageFor(error, fallback) {
  if (axios.isAxiosError(error)) return error.response?.data?.detail || fallback
  return fallback
}

function initials(name) {
  return (name || 'PaddyScan User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function memberSince(createdAt) {
  if (!createdAt) return 'PaddyScan member'
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(createdAt))
}

export default function AccountPage() {
  const { user, changePassword, updateProfile } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirmation: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  function openProfile() {
    setProfileForm({
      fullName: user?.fullName || '',
    })
    setProfileError('')
    setProfileSuccess('')
    setPasswordOpen(false)
    setProfileOpen(true)
  }

  function closeProfile() {
    setProfileOpen(false)
    setProfileError('')
  }

  function openPassword() {
    setPasswordForm({ current: '', next: '', confirmation: '' })
    setPasswordError('')
    setPasswordSuccess('')
    setShowPasswords(false)
    setProfileOpen(false)
    setPasswordOpen(true)
  }

  function closePassword() {
    setPasswordOpen(false)
    setPasswordError('')
    setShowPasswords(false)
  }

  async function submitProfile(event) {
    event.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      await updateProfile(profileForm)
      setProfileOpen(false)
      setProfileSuccess('Your profile has been updated.')
    } catch (error) {
      setProfileError(messageFor(error, 'Your profile could not be updated.'))
    } finally {
      setProfileLoading(false)
    }
  }

  async function submitPassword(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.next !== passwordForm.confirmation) {
      setPasswordError('The new passwords do not match.')
      return
    }

    setPasswordLoading(true)
    try {
      await changePassword(passwordForm.current, passwordForm.next)
      setPasswordForm({ current: '', next: '', confirmation: '' })
      setPasswordOpen(false)
      setShowPasswords(false)
      setPasswordSuccess('Your password has been changed securely.')
    } catch (error) {
      setPasswordError(messageFor(error, 'Your password could not be changed.'))
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-129px)] bg-[#f6f8f3] px-5 py-10 sm:px-8 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="eyebrow">Your account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">Profile & security</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/50">Keep your farm details current and manage how you access PaddyScan.</p>
        </div>

        {(profileSuccess || passwordSuccess) && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
            <CheckCircle2 size={18} /> {profileSuccess || passwordSuccess}
          </div>
        )}

        <aside className="overflow-hidden rounded-[30px] border border-ink/10 shadow-soft">
          <div className="relative min-h-[300px] bg-gradient-to-br from-[#153b2a] via-forest to-[#2f6d49] px-7 pb-9 pt-8 text-white sm:px-10 sm:pb-11 sm:pt-10">
            <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full border border-white/10 bg-white/5" />
            <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-lime/10 blur-2xl" />

            <div className="relative flex items-start justify-between gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-3xl border border-white/20 bg-white/15 text-2xl font-semibold shadow-lg backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
                {initials(user?.fullName)}
              </div>
              <div className="flex gap-2.5">
                <button type="button" onClick={openProfile} aria-label="Edit profile" title="Edit profile" className="group relative grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-forest focus:outline-none focus:ring-2 focus:ring-lime/70">
                  <Pencil size={19} />
                  <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">Edit profile</span>
                </button>
                <button type="button" onClick={openPassword} aria-label="Change password" title="Change password" className="group relative grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-forest focus:outline-none focus:ring-2 focus:ring-lime/70">
                  <KeyRound size={20} />
                  <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">Change password</span>
                </button>
              </div>
            </div>

            <div className="relative mt-8">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{user?.fullName}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/65 sm:text-base"><Mail size={16} /> {user?.email}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-white/65"><CalendarDays size={16} /> Member since {memberSince(user?.createdAt)}</p>
            </div>
          </div>
        </aside>

        {profileOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#0b1f17]/55 px-4 py-8 backdrop-blur-sm" role="presentation" onMouseDown={closeProfile}>
            <section role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-[28px] border border-white/60 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><p className="eyebrow">Account details</p><h2 id="edit-profile-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">Edit profile</h2><p className="mt-1.5 text-sm text-ink/45">Update the details shown on your PaddyScan account.</p></div>
                <button type="button" onClick={closeProfile} aria-label="Close profile editor" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 text-ink/45 transition hover:bg-ink/5 hover:text-ink"><X size={18} /></button>
              </div>
              <form onSubmit={submitProfile} className="mt-7 border-t border-ink/8 pt-7">
                <div className="grid gap-5">
                  <label className="auth-field"><span>Full name</span><input value={profileForm.fullName} onChange={(event) => setProfileForm({ fullName: event.target.value })} required minLength={2} autoComplete="name" placeholder="Your full name" /></label>
                  <label className="auth-field"><span>Email address</span><input value={user?.email || ''} disabled className="cursor-not-allowed bg-ink/[0.035] text-ink/45" /><small className="mt-1.5 text-[11px] font-normal normal-case tracking-normal text-ink/35">Your sign-in email cannot be changed here.</small></label>
                </div>
                {profileError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{profileError}</div>}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closeProfile} className="secondary-button">Cancel</button><button type="submit" disabled={profileLoading} className="primary-button"><Save size={16} /> {profileLoading ? 'Saving…' : 'Save profile'}</button></div>
              </form>
            </section>
          </div>
        )}

        {passwordOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#0b1f17]/55 px-4 py-8 backdrop-blur-sm" role="presentation" onMouseDown={closePassword}>
            <section role="dialog" aria-modal="true" aria-labelledby="change-password-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-[28px] border border-white/60 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><p className="eyebrow">Account security</p><h2 id="change-password-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">Change password</h2><p className="mt-1.5 text-sm text-ink/45">Choose a strong password you do not use elsewhere.</p></div>
                <button type="button" onClick={closePassword} aria-label="Close password form" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 text-ink/45 transition hover:bg-ink/5 hover:text-ink"><X size={18} /></button>
              </div>
              <form onSubmit={submitPassword} className="mt-7 border-t border-ink/8 pt-7">
                <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#f6f8f3] px-4 py-3.5"><p className="text-xs leading-5 text-ink/50">Use at least 8 characters with letters, numbers and symbols.</p><button type="button" onClick={() => setShowPasswords((current) => !current)} className="ml-4 flex shrink-0 items-center gap-2 text-xs font-semibold text-forest hover:text-ink" aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}>{showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}<span className="hidden sm:inline">{showPasswords ? 'Hide' : 'Show'}</span></button></div>
                <div className="grid gap-5">
                  <label className="auth-field"><span>Current password</span><input type={showPasswords ? 'text' : 'password'} value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} required autoComplete="current-password" placeholder="Enter your current password" /></label>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="auth-field"><span>New password</span><input type={showPasswords ? 'text' : 'password'} value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} required minLength={8} autoComplete="new-password" placeholder="Create a new password" /></label>
                    <label className="auth-field"><span>Confirm new password</span><input type={showPasswords ? 'text' : 'password'} value={passwordForm.confirmation} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmation: event.target.value }))} required minLength={8} autoComplete="new-password" placeholder="Repeat the new password" /></label>
                  </div>
                </div>
                {passwordError && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{passwordError}</div>}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closePassword} className="secondary-button">Cancel</button><button type="submit" disabled={passwordLoading} className="primary-button"><KeyRound size={16} /> {passwordLoading ? 'Updating…' : 'Update password'}</button></div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
