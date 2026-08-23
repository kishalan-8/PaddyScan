import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth-context'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return (
      <div className="grid min-h-[65vh] place-items-center px-5">
        <div className="text-center">
          <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />
          <p className="mt-4 text-sm text-ink/45">Restoring your field journal…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
