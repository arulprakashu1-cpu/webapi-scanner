import { api } from './client'

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  company?: string
  is_verified: boolean
  plan: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
  require_password_change: boolean
}

export const authApi = {
  register: (data: {
    first_name: string
    last_name: string
    email: string
    password: string
    confirm_password: string
    company?: string
    captcha_token: string
  }) => api.post('/api/auth/register', data),

  login: (data: { email: string; password: string; captcha_token: string }) =>
    api.post<LoginResponse>('/api/auth/login', data),

  logout: () => api.post('/api/auth/logout'),

  refresh: () => api.post('/api/auth/refresh'),

  me: () => api.get<User>('/api/auth/me'),

  verifyEmail: (token: string) => api.get(`/api/auth/verify-email?token=${token}`),

  resendVerification: (email: string) =>
    api.post('/api/auth/resend-verification', { email }),

  forgotPassword: (data: { email: string; captcha_token: string }) =>
    api.post('/api/auth/forgot-password', data),

  resetPassword: (data: { token: string; new_password: string; confirm_password: string }) =>
    api.post('/api/auth/reset-password', data),

  changePassword: (data: { current_password: string; new_password: string; confirm_password: string }) =>
    api.post('/api/auth/change-password', data),

  updateProfile: (data: { first_name?: string; last_name?: string; company?: string }) =>
    api.put<User>('/api/auth/me', data),

  deleteAccount: (data: { reason?: string }) => api.delete('/api/auth/me', { data }),
}
