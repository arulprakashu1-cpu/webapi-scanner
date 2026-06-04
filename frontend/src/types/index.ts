export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  email_verified: boolean
  plan: 'free' | 'pro'
  is_admin: boolean
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name?: string
  plan: 'free' | 'pro'
  is_admin: boolean
  is_active: boolean
  payment_status: 'none' | 'trial' | 'active' | 'expired' | 'cancelled'
  email_verified: boolean
  created_at: string
  last_login?: string
  total_scans: number
  total_findings: number
  org_name?: string
}

export interface AdminStats {
  total_users: number
  active_users: number
  pro_users: number
  free_users: number
  disabled_users: number
  total_scans: number
  completed_scans: number
  total_findings: number
  scans_this_month: number
  new_users_this_month: number
}

export interface AdminScan {
  id: string
  name: string
  status: string
  target_url?: string
  created_at?: string
  finished_at?: string
  security_score?: number
  findings_count: number
  org_name?: string
  owner_email?: string
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
  security_score?: number
  endpoints_count?: number
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
  security_score?: number
  https_enforced?: boolean
  headers_pass?: boolean
  cors_safe?: boolean
  endpoints_count?: number
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
  completed_scans: number
  last_scan_status?: string
  last_findings_count?: number
  last_security_score?: number
  last_high_count?: number
  last_medium_count?: number
}
