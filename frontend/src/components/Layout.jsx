import { useEffect, useState } from 'react'
import { LogOut, Menu, Sprout, UserRound, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { navigation } from '../routes/navigation'
import { useAuth } from '../context/auth-context'

export default function Layout() {
  const { user, isAuthenticated, isAuthLoading, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const visibleNavigation = navigation.filter((item) => !item.authenticated || isAuthenticated)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  const signOut = () => {
    setMobileMenuOpen(false)
    logout()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-[#f7f8f2]/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label="PaddyScan home">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-white">
              <Sprout size={16} strokeWidth={2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">PaddyScan</span>
          </NavLink>

          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <nav aria-label="Main navigation" className="flex min-w-0 items-center gap-1">
              {visibleNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-forest/10 text-forest' : 'text-ink/55 hover:bg-forest/5 hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {!isAuthLoading && (isAuthenticated ? (
              <div className="ml-2 flex items-center gap-1 border-l border-ink/10 pl-3">
                <Link to="/account" className="flex items-center gap-2 rounded-lg p-1.5 text-ink/60 hover:bg-forest/5 hover:text-forest" title={`${user.fullName} · Account settings`}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-xs font-semibold text-white">{user.fullName.charAt(0).toUpperCase()}</span>
                  <span className="hidden max-w-24 truncate text-xs font-semibold xl:block">{user.fullName}</span>
                </Link>
                <button type="button" onClick={logout} className="grid h-9 w-9 place-items-center rounded-lg text-ink/35 hover:bg-red-50 hover:text-red-700" title="Sign out" aria-label="Sign out"><LogOut size={15} /></button>
              </div>
            ) : (
              <Link to="/login" className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white hover:bg-ink">
                <UserRound size={14} /> Sign in
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-ink/10 bg-white/55 text-ink transition hover:bg-white lg:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 top-16 z-0 cursor-default bg-ink/20 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div id="mobile-navigation" className="absolute inset-x-0 top-full z-10 border-b border-ink/10 bg-[#f7f8f2] px-4 pb-5 pt-3 shadow-[0_22px_45px_rgba(17,48,39,0.16)] sm:px-8 lg:hidden">
              <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl gap-1">
                {visibleNavigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive ? 'bg-forest text-white' : 'text-ink/65 hover:bg-forest/5 hover:text-forest'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {!isAuthLoading && (
                <div className="mx-auto mt-3 max-w-7xl border-t border-ink/10 pt-3">
                  {isAuthenticated ? (
                    <div className="flex items-center gap-2">
                      <Link to="/account" className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl bg-white/60 px-3 py-2 text-ink/70">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest text-xs font-semibold text-white">{user.fullName.charAt(0).toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">{user.fullName}</span>
                          <span className="block text-[10px] text-ink/45">Profile &amp; security</span>
                        </span>
                      </Link>
                      <button type="button" onClick={signOut} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border border-red-900/10 bg-red-50 px-4 text-xs font-semibold text-red-700">
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  ) : (
                    <Link to="/login" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white hover:bg-ink">
                      <UserRound size={16} /> Sign in
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink/10 px-5 py-7 text-center text-xs leading-5 text-ink/45">
        <p>AI-assisted screening for rice leaf disease.</p>
        <p className="mt-1.5">
          Built by <strong className="font-semibold text-ink/65">Kishalan Prakalathan</strong>
          {' · '}BSc Computer Science{' · '}University of Bedfordshire
        </p>
      </footer>
    </div>
  )
}
