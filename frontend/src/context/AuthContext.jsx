import { useCallback, useEffect, useMemo, useState } from 'react'
import { changeAccountPassword, loginAccount, logoutAccount, refreshSession, signupAccount, updateAccountProfile } from '../services/auth'
import { setAccessToken } from '../services/api'
import { AuthContext } from './auth-context'

let sessionRestorePromise = null

function restoreSessionOnce() {
  sessionRestorePromise ||= refreshSession()
  return sessionRestorePromise
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken)
    setUser(session.user)
    return session.user
  }, [])

  useEffect(() => {
    let active = true
    restoreSessionOnce()
      .then((session) => {
        if (active) applySession(session)
      })
      .catch(() => {
        if (active) {
          setAccessToken('')
          setUser(null)
        }
      })
      .finally(() => {
        if (active) setIsAuthLoading(false)
      })

    const expireSession = () => {
      setAccessToken('')
      setUser(null)
    }
    window.addEventListener('paddyscan:session-expired', expireSession)
    return () => {
      active = false
      window.removeEventListener('paddyscan:session-expired', expireSession)
    }
  }, [applySession])

  const login = useCallback(async (credentials) => {
    const session = await loginAccount(credentials)
    return applySession(session)
  }, [applySession])

  const signup = useCallback(async (details) => {
    const session = await signupAccount(details)
    return applySession(session)
  }, [applySession])

  const logout = useCallback(async () => {
    try {
      await logoutAccount()
    } finally {
      setAccessToken('')
      setUser(null)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const session = await changeAccountPassword(currentPassword, newPassword)
    return applySession(session)
  }, [applySession])

  const updateProfile = useCallback(async (profile) => {
    const updatedUser = await updateAccountProfile(profile)
    setUser(updatedUser)
    return updatedUser
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isAuthLoading, login, signup, logout, changePassword, updateProfile }),
    [user, isAuthLoading, login, signup, logout, changePassword, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
