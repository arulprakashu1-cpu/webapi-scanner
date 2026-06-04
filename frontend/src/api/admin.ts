import axios from 'axios'
import { AdminUser, AdminStats, AdminScan } from '../types'

const adminApi_client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})
adminApi_client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const adminApi = {
  stats: () =>
    adminApi_client.get<AdminStats>('/admin/stats').then((r) => r.data),

  users: () =>
    adminApi_client.get<AdminUser[]>('/admin/users').then((r) => r.data),

  updateUser: (id: string, data: { plan?: string; is_active?: boolean; payment_status?: string; is_admin?: boolean }) =>
    adminApi_client.patch<AdminUser>(`/admin/users/${id}`, data).then((r) => r.data),

  scans: (limit = 100, offset = 0) =>
    adminApi_client.get<{ scans: AdminScan[]; total: number }>(`/admin/scans?limit=${limit}&offset=${offset}`).then((r) => r.data),
}
