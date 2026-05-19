import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard,
  ShieldCheck,
  Zap,
  FileBarChart,
  Lock,
  UserCheck,
  AlertTriangle,
  Eye,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

const overviewItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scans',     icon: ShieldCheck,     label: 'All Findings', countKey: 'findings' },
  { to: '/targets',   icon: Zap,             label: 'Endpoints' },
  { to: '/reports',   icon: FileBarChart,    label: 'Reports' },
]

const securityItems = [
  { to: '/scans?cat=auth',   icon: Lock,          label: 'Authentication' },
  { to: '/scans?cat=authz',  icon: UserCheck,     label: 'Authorization' },
  { to: '/scans?cat=inject', icon: AlertTriangle, label: 'Injection Risks' },
  { to: '/scans?cat=data',   icon: Eye,           label: 'Data Exposure' },
]

function scoreClass(score: number | null | undefined) {
  if (score == null) return ''
  if (score >= 70) return 's-good'
  if (score >= 40) return 's-warn'
  return 's-bad'
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme } = useTheme()

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: scansApi.list,
    staleTime: 30_000,
  })

  const totalFindings = scans.reduce((n: number, s: any) => n + (s.findings_count ?? 0), 0)
  const recent = scans.slice(0, 4)

  const isActive = (to: string) => {
    const path = to.split('?')[0]
    if (path === '/scans') return location.pathname.startsWith('/scans')
    if (path === '/targets') return location.pathname.startsWith('/targets')
    return location.pathname === path
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '0 20px 20px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '18px',
      }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          <img
            src={theme === 'dark' ? '/logo-white.svg' : '/logo-dark.svg'}
            alt="GozoBee"
            style={{ height: '30px', display: 'block' }}
          />
        </Link>
      </div>

      {/* OVERVIEW */}
      <div className="sidebar-section">
        <div className="sidebar-label">Overview</div>
        <nav>
          {overviewItems.map(({ to, icon: Icon, label, countKey }) => {
            const active = isActive(to)
            return (
              <Link key={to} to={to} className={`nav-item${active ? ' active' : ''}`}>
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {countKey === 'findings' && totalFindings > 0 && (
                  <span className="nav-count">{totalFindings}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* SECURITY CHECKS */}
      <div className="sidebar-section">
        <div className="sidebar-label">Security Checks</div>
        <nav>
          {securityItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link key={to} to={to} className={`nav-item${active ? ' active' : ''}`}>
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* RECENT SCANS */}
      {recent.length > 0 && (
        <div className="sidebar-section" style={{ flex: 1 }}>
          <div className="sidebar-label">Recent Scans</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {recent.map((scan: any) => (
              <Link key={scan.id} to={`/scans/${scan.id}`} className="recent-item">
                <span className="recent-name">{scan.name}</span>
                <span className={`score-pill ${scoreClass(scan.security_score)}`}>
                  {scan.security_score != null ? scan.security_score : '—'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* PROMO CARD */}
      <div className="promo-card">
        <Sparkles size={16} style={{ color: 'var(--brand)', marginBottom: '6px' }} />
        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-head)', marginBottom: '4px' }}>
          Upgrade to Pro
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
          Unlock AI analysis, PDF reports, and unlimited scans.
        </div>
        <button
          onClick={() => navigate('/pricing')}
          style={{
            width: '100%',
            padding: '7px',
            borderRadius: '8px',
            background: 'var(--brand)',
            color: '#000',
            fontWeight: 700,
            fontSize: '12px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          View plans <ChevronRight size={12} />
        </button>
      </div>
    </aside>
  )
}
