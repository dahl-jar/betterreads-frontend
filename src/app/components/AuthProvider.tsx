import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { deleteAccount as deleteAccountRequest } from '@/features/auth/api/deleteAccount'
import { login as loginRequest } from '@/features/auth/api/login'
import { logout as logoutRequest } from '@/features/auth/api/logout'
import { refresh as refreshRequest } from '@/features/auth/api/refresh'
import { type AuthResponse } from '@/features/auth/api/schemas'
import { AuthContext, type AuthStatus } from '@/hooks/useAuth'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken, setAccessToken } from '@/lib/api/token'
import { clearDrafts } from '@/lib/draftStore'
import { type CurrentUser, type LoginInput } from '@/types/auth'

/** Keeps the access token in memory and restores the session from the refresh cookie. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | undefined>(undefined)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const clearSession = useCallback(() => {
    clearAccessToken()
    setUser(undefined)
    setStatus('anonymous')
  }, [])

  const establishSession = useCallback(({ accessToken, user: currentUser }: AuthResponse) => {
    setAccessToken(accessToken)
    setUser(currentUser)
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    setRefreshHandler(async () => {
      try {
        establishSession(await refreshRequest())
      } catch (error: unknown) {
        clearSession()
        throw error
      }
    })
    return () => setRefreshHandler(undefined)
  }, [clearSession, establishSession])

  useEffect(() => {
    let active = true
    refreshRequest()
      .then((response) => {
        if (active) {
          establishSession(response)
        }
      })
      .catch(() => {
        if (active) {
          clearSession()
        }
      })
    return () => {
      active = false
    }
  }, [establishSession, clearSession])

  const login = useCallback(
    async (input: LoginInput) => {
      establishSession(await loginRequest(input))
    },
    [establishSession],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearDrafts()
      clearSession()
    }
  }, [clearSession])

  const deleteAccount = useCallback(async () => {
    await deleteAccountRequest()
    clearDrafts()
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({ user, status, login, logout, deleteAccount }),
    [user, status, login, logout, deleteAccount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
