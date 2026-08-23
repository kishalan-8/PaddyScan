import { LogOut, Sprout, UserRound } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { navigation } from '../routes/navigation'
import { useAuth } from '../context/auth-context'

export default function Layout() {
  const { user, isAuthenticated, isAuthLoading, logout } = useAuth()
  const visibleNavigation = navigation.filter((item) => !item.authenticated || isAuthenticated)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative z-20 border-b border-ink/10 bg-[#f7f8f2]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="PaddyScan home">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-white">
              <Sprout size={16} strokeWidth={2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">PaddyScan</span>
          </NavLink>

          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <nav aria-label="Main navigation" className="flex min-w-0 items-center gap-0 sm:gap-1">
            {visibleNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-1.5 py-2 text-[11px] font-medium transition-colors min-[430px]:px-2 sm:px-3 sm:text-sm ${
                    isActive ? 'bg-forest/10 text-forest' : 'text-ink/55 hover:text-ink'
                  }`
                }
              >
                <span className="sm:hidden">{item.shortLabel || item.label}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {!isAuthLoading && (isAuthenticated ? (
            <div className="ml-1 flex items-center gap-1 border-l border-ink/10 pl-2 sm:ml-2 sm:pl-3">
              <Link to="/account" className="flex items-center gap-2 rounded-lg p-1.5 text-ink/60 hover:bg-forest/5 hover:text-forest" title={`${user.fullName} · Account settings`}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-xs font-semibold text-white">{user.fullName.charAt(0).toUpperCase()}</span>
                <span className="hidden max-w-24 truncate text-xs font-semibold lg:block">{user.fullName}</span>
              </Link>
              <button type="button" onClick={logout} className="grid h-8 w-8 place-items-center rounded-lg text-ink/35 hover:bg-red-50 hover:text-red-700" title="Sign out" aria-label="Sign out"><LogOut size={15} /></button>
            </div>
          ) : (
            <Link to="/login" className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-forest px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-ink sm:ml-2 sm:px-4 sm:text-xs">
              <UserRound size={14} /> <span className="hidden min-[390px]:inline">Sign in</span>
            </Link>
          ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink/10 px-5 py-7 text-center text-xs text-ink/45">
        <p>AI-assisted screening for rice leaf disease.</p>
      </footer>
    </div>
  )
}
