export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  email_verified: boolean
  created_at: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

export type ScanStatus = 'queued' | 'running' | 'analyzing' | 'completed' | 'failed'
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface ScanListItem {
  id: string
  name: string
  status: ScanStatus
  target_url?: string
  created_at: string
  finished_at?: string
  findings_count: number
  high_count: number
  medium_count: number
  low_count: number
}

export interface ScanDetail {
  id: string
  name: string
  description?: string
  status: ScanStatus
  target_type: string
  target_url?: string
  auth_type: string
  created_at: string
  started_at?: string
  finished_at?: string
  error_message?: string
  progress: number
  findings_count: number
  severity_summary?: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
}

export interface ScanFinding {
  id: string
  severity: Severity
  title: string
  description?: string
  confidence?: string
  endpoint?: string
  method?: string
  remediation?: string
  cwe_id?: string
  owasp_category?: string
  created_at: string
}

export interface Usage {
  monthly_scans: number
  limit: number
  plan: string
  remaining: number
}

export interface AiAnalysis {
  executive_summary: string
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  attack_narrative: string
  top_priorities: string[]
  quick_wins: string[]
  cached: boolean
}

export interface ApiTarget {
  id: string
  name: string
  url: string
  description?: string
  auth_type: string
  created_at: string
  last_scanned_at?: string
  total_scans: number
  last_scan_status?: string
}
