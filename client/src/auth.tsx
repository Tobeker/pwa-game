import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

export type AuthData = {
  token: string
  refreshToken: string
  name?: string
  email?: string // legacy
  userId?: string
  createdAt?: string
}

type AuthContextValue = {
  auth: AuthData | null
  setAuth: (data: AuthData | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthData | null>(() => {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as AuthData
      // Backwards compatibility: migrate email -> name
      if (parsed && !parsed.name && parsed.email) {
        return { ...parsed, name: parsed.email }
      }
      return parsed
    } catch (err) {
      console.warn('Konnte auth nicht laden', err)
      localStorage.removeItem('auth')
      return null
    }
  })

  const setAuth = useCallback((data: AuthData | null) => {
    setAuthState(data)
    if (data) {
      localStorage.setItem('auth', JSON.stringify(data))
    } else {
      localStorage.removeItem('auth')
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ auth: authState, setAuth }), [authState, setAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth muss innerhalb eines AuthProvider genutzt werden')
  }
  return ctx
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth()
  if (!auth?.token) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
