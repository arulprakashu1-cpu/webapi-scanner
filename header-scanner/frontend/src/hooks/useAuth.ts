import { useState, useEffect, useCallback } from 'react'
import { authApi, User } from '../api/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const token = localStorage.getItem('hs_access_token')
    const cached = localStorage.getItem('hs_user')
    if (token && cached) {
      try {
        const user = JSON.parse(cached) as User
        setState({ user, isLoading: false, isAuthenticated: true })
      } catch {
        setState({ user: null, isLoading: false, isAuthenticated: false })
      }
    } else {
      setState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }, [])

  const login = useCallback(async (email: string, password: string, captchaToken: string) => {
    const resp = await authApi.login({ email, password, captcha_token: captchaToken })
    const { access_token, user, require_password_change } = resp.data
    localStorage.setItem('hs_access_token', access_token)
    localStorage.setItem('hs_user', JSON.stringify(user))
    setState({ user, isLoading: false, isAuthenticated: true })
    return { require_password_change }
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('hs_access_token')
    localStorage.removeItem('hs_user')
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const resp = await authApi.me()
      const user = resp.data
      localStorage.setItem('hs_user', JSON.stringify(user))
      setState((prev) => ({ ...prev, user }))
    } catch {}
  }, [])

  return { ...state, login, logout, refreshUser }
}
