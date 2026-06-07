import { api } from './client'

export interface ScanProfile {
  id: number
  site_name: string | null
  url: string
  created_at: string
  updated_at: string
  custom_headers: Array<{ id: number; header_key: string; header_value: string }>
  latest_grade: string | null
  scan_count: number
}

export interface ScanRun {
  id: number
  profile_id: number | null
  scan_name: string | null
  grade: string | null
  status: string
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  info_count: number
  vt_malicious: number | null
  vt_suspicious: number | null
  vt_harmless: number | null
  vt_verdict: string | null
  scanned_at: string
  target_url: string | null
}

export interface ScanFinding {
  id: number
  header_name: string
  status: string
  severity: string
  standard: string | null
  description: string | null
  payload: string | null
  remediation: string | null
  reference_links: string | null
}

export interface PublicScanResult {
  url: string
  reachable: boolean
  error?: string
  grade: string
  counts: Record<string, number>
  findings: Array<{
    header_name: string
    status: string
    severity: string
    standard: string | null
    description: string | null
    payload: string | null
    remediation: string | null
    reference_links: string | null
  }>
  virustotal: {
    malicious: number
    suspicious: number
    harmless: number
    verdict: string
    top_engines: Array<{ engine: string; category: string; result: string }>
  } | null
}

export const scansApi = {
  publicScan: (data: { url: string; captcha_token: string }) =>
    api.post<PublicScanResult>('/api/scans/public', data),

  listProfiles: () => api.get<ScanProfile[]>('/api/scans/profiles'),

  createProfile: (data: { url: string; site_name?: string }) =>
    api.post<ScanProfile>('/api/scans/profiles', data),

  updateProfile: (id: number, data: {
    site_name?: string
    custom_headers?: Array<{ header_key: string; header_value: string }>
  }) => api.put<ScanProfile>(`/api/scans/profiles/${id}`, data),

  deleteProfile: (id: number) => api.delete(`/api/scans/profiles/${id}`),

  runScan: (profileId: number, scanName?: string) =>
    api.post<{ run: ScanRun; oldest_deleted: boolean }>(`/api/scans/profiles/${profileId}/run`, {
      scan_name: scanName,
    }),

  getProfileRuns: (profileId: number) =>
    api.get<ScanRun[]>(`/api/scans/profiles/${profileId}/runs`),

  getRun: (runId: number) => api.get<ScanRun>(`/api/scans/runs/${runId}`),

  getRunFindings: (runId: number) => api.get<ScanFinding[]>(`/api/scans/runs/${runId}/findings`),

  deleteRun: (runId: number) => api.delete(`/api/scans/runs/${runId}`),

  downloadReport: (runId: number, format: 'json' | 'pdf') => {
    const token = localStorage.getItem('hs_access_token')
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
    const url = `${baseUrl}/api/scans/runs/${runId}/report?format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = `scan_${runId}.${format}`
    // We need auth header — open in new tab with token approach via fetch
    return fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then((r) => r.blob())
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob)
        a.href = objUrl
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(objUrl)
        document.body.removeChild(a)
      })
  },
}
