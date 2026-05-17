import api from './client'
import { ScanListItem, ScanDetail, ScanFinding, Usage, AiAnalysis, ApiTarget } from '../types'

export interface CreateScanPayload {
  name: string
  description?: string
  target_type: string
  target_url?: string
  auth_type: string
  auth_header_name?: string
  auth_header_value?: string
}

export const scansApi = {
  list: () => api.get<ScanListItem[]>('/scans/').then((r) => r.data),

  get: (id: string) => api.get<ScanDetail>(`/scans/${id}`).then((r) => r.data),

  create: (payload: CreateScanPayload) => api.post<ScanDetail>('/scans/', payload).then((r) => r.data),

  findings: (id: string) => api.get<ScanFinding[]>(`/scans/${id}/findings`).then((r) => r.data),

  exportJson: (id: string) => {
    const token = localStorage.getItem('access_token')
    window.open(`/api/reports/${id}/export/json?token=${token}`, '_blank')
    // Actually use fetch for proper download
    return fetch(`/api/reports/${id}/export/json`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `scan-${id.slice(0, 8)}-report.json`
        a.click()
        URL.revokeObjectURL(url)
      })
  },

  exportCsv: (id: string) => {
    const token = localStorage.getItem('access_token')
    return fetch(`/api/reports/${id}/export/csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `scan-${id.slice(0, 8)}-report.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
  },

  usage: () => api.get<Usage>('/usage/').then((r) => r.data),

  exportPdf: (id: string) => {
    const token = localStorage.getItem('access_token')
    return fetch(`/api/reports/${id}/export/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `scan-${id.slice(0, 8)}-report.pdf`
        a.click()
        URL.revokeObjectURL(url)
      })
  },

  analyze: (id: string) =>
    api.post<AiAnalysis>(`/reports/${id}/analyze`).then((r) => r.data),

  targets: {
    list: () => api.get<ApiTarget[]>('/targets/').then((r) => r.data),
    create: (data: { name: string; url: string; description?: string; auth_type: string }) =>
      api.post<ApiTarget>('/targets/', data).then((r) => r.data),
    delete: (id: string) => api.delete(`/targets/${id}`).then((r) => r.data),
  },
}
