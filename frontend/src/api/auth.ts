import api from './client'
import { AuthToken, User } from '../types'

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    api.post<AuthToken>('/auth/register', { email, password, full_name }).then((r) => r.data),

  login: (email: string, password: string, captcha_token?: string) =>
    api.post<AuthToken>('/auth/login', { email, password, captcha_token }).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
