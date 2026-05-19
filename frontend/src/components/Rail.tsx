import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import {
  LayoutDashboard,
  ShieldAlert,
  Zap,
  FileText,
  GitBranch,
  Settings,
  LogOut,
} from 'lucide-react'

const railItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scans',     icon: ShieldAlert,     label: 'Findings' },
  { to: '/targets',   icon: Zap,             label: 'Endpoints' },
  { to: '/reports',   icon: FileText,         label: 'Reports' },
  { to: '/ci',        icon: GitBranch,        label: 'CI/CD' },
  { to: '/settings',  icon: Settings,         label: 'Settings' },
]

export default function Rail() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: scansApi.list,
    staleTime: 30_000,
  })

  const criticalCount = scans.reduce((n: number, s: any) => n + (s.high_count ?? 0), 0)
  const initials = (user?.full_name || user?.email || 'U')[0].toUpperCase()

  const isActive = (to: string) => {
    if (to === '/scans') return location.pathname.startsWith('/scans')
    if (to === '/targets') return location.pathname.startsWith('/targets')
    return location.pathname === to
  }

  return (
    <nav className="rail">
      {/* Nav icons */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 0' }}>
        {railItems.map(({ to, icon: Icon, label }) => {
          const active = isActive(to)
          return (
            <Link key={to} to={to} title={label} className={`rail-btn${active ? ' active' : ''}`}>
              <Icon size={18} />
              {to === '/scans' && criticalCount > 0 && (
                <span className="rail-badge">{criticalCount > 9 ? '9+' : criticalCount}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Avatar + logout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '8px' }}>
        <button
          title="Sign out"
          onClick={() => { logout(); navigate('/') }}
          className="rail-btn"
          style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}
        >
          <LogOut size={16} />
        </button>
        <div title={user?.email || ''} style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand), #d4880e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '13px',
          color: '#000',
          cursor: 'default',
          flexShrink: 0,
        }}>
          {initials}
        </div>
      </div>
    </nav>
  )
}
