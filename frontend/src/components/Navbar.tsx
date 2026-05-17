import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import StatusBadge from './StatusBadge'
import {
  Shield,
  LayoutDashboard,
  ScanLine,
  Target,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Search,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scans/new',  icon: ScanLine,         label: 'Scans' },
  { to: '/targets',    icon: Target,           label: 'Targets' },
]

interface NavbarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Navbar({ collapsed, onToggle }: NavbarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [quickUrl, setQuickUrl] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: recentScans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: scansApi.list,
    staleTime: 30_000,
  })

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: scansApi.usage,
    staleTime: 60_000,
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (quickUrl.trim()) {
      navigate(`/scans/new?url=${encodeURIComponent(quickUrl.trim())}`)
      setQuickUrl('')
    }
  }

  const lastThree = recentScans.slice(0, 3)
  const usagePct = usage ? Math.min(100, (usage.monthly_scans / usage.limit) * 100) : 0
  const initials = (user?.full_name || user?.email || 'U')[0].toUpperCase()
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User'

  const sectionLabel = (text: string) =>
    collapsed ? null : (
      <div style={{
        fontSize: '9.5px',
        fontWeight: 700,
        color: 'var(--c-t4)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '10px 16px 4px',
      }}>
        {text}
      </div>
    )

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '220px',
        minHeight: '100vh',
        background: 'var(--c-nav)',
        borderRight: '1px solid var(--c-b1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* ── Top: Logo + toggle ── */}
      <div style={{
        padding: collapsed ? '16px 0' : '16px 12px',
        borderBottom: '1px solid var(--c-b1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '8px',
        flexShrink: 0,
      }}>
        {collapsed ? (
          <button
            onClick={onToggle}
            title="Expand sidebar"
            style={{
              background: 'var(--c-accent)',
              border: 'none',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Shield size={18} color="#000" strokeWidth={2.5} />
          </button>
        ) : (
          <>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', flex: 1, minWidth: 0 }}>
              <div style={{
                background: 'var(--c-accent)',
                borderRadius: '10px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Shield size={18} color="#000" strokeWidth={2.5} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--c-t1)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>ScanAPI</div>
                <div style={{ fontSize: '10px', color: 'var(--c-t4)', marginTop: '1px', whiteSpace: 'nowrap' }}>Security Scanner</div>
              </div>
            </Link>
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              style={{
                background: 'none',
                border: '1px solid var(--c-b1)',
                borderRadius: '7px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--c-t3)',
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* NAVIGATION section */}
        {sectionLabel('Navigation')}
        <nav style={{ padding: collapsed ? '6px 8px' : '4px 8px' }}>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
              || (to === '/scans/new' && location.pathname.startsWith('/scans'))
              || (to === '/targets' && location.pathname.startsWith('/targets'))
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : '9px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '8px 10px',
                  borderRadius: '10px',
                  marginBottom: '2px',
                  background: isActive ? 'var(--c-accent)' : 'transparent',
                  color: isActive ? '#000' : 'var(--c-t2)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  transition: 'background 0.1s, color 0.1s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--c-hover)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--c-t1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--c-t2)'
                  }
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* QUICK SCAN section */}
        {!collapsed && (
          <>
            {sectionLabel('Quick Scan')}
            <div style={{ padding: '4px 8px 8px' }}>
              <form onSubmit={handleQuickScan} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  style={{
                    width: '100%',
                    background: 'var(--c-input)',
                    border: '1px solid var(--c-b2)',
                    color: 'var(--c-t1)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)'
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'var(--c-accent)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--c-accent-h)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--c-accent)')}
                >
                  <Search size={12} />
                  Scan
                </button>
              </form>
            </div>
          </>
        )}

        {/* RECENT SCANS section */}
        {!collapsed && lastThree.length > 0 && (
          <>
            {sectionLabel('Recent Scans')}
            <div style={{ padding: '4px 8px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {lastThree.map((scan) => (
                <Link
                  key={scan.id}
                  to={`/scans/${scan.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '7px 10px',
                    borderRadius: '9px',
                    textDecoration: 'none',
                    background: 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--c-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--c-t1)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {scan.name}
                  </span>
                  <StatusBadge status={scan.status} />
                </Link>
              ))}
            </div>
          </>
        )}

        {/* THIS MONTH section */}
        {!collapsed && usage && (
          <>
            {sectionLabel('This Month')}
            <div style={{ padding: '4px 12px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px', color: 'var(--c-t3)' }}>Scans</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: usage.monthly_scans >= usage.limit ? 'var(--c-danger)' : 'var(--c-accent)',
                }}>
                  {usage.monthly_scans} / {usage.limit}
                </span>
              </div>
              <div style={{ width: '100%', background: 'var(--c-b1)', borderRadius: '99px', height: '5px' }}>
                <div style={{
                  height: '5px',
                  borderRadius: '99px',
                  background: usage.monthly_scans >= usage.limit ? 'var(--c-danger)' : 'var(--c-accent)',
                  width: `${usagePct}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--c-t4)', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {usage.plan} plan
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Bottom: theme + user ── */}
      <div style={{
        borderTop: '1px solid var(--c-b1)',
        padding: collapsed ? '10px 8px' : '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0,
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : '9px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '8px 10px',
            background: 'none',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            color: 'var(--c-t2)',
            fontSize: '13px',
            fontWeight: 500,
            width: '100%',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--c-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--c-t1)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--c-t2)'
          }}
        >
          {theme === 'dark'
            ? <Sun size={15} style={{ flexShrink: 0 }} />
            : <Moon size={15} style={{ flexShrink: 0 }} />}
          {!collapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
        </button>

        {/* User */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            title={collapsed ? displayName : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : '9px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '8px 0' : '8px 10px',
              background: 'none',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              width: '100%',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--c-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--c-accent), #FF8C00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              color: '#000',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--c-t1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {displayName}
                </div>
                <div style={{
                  fontSize: '10.5px',
                  color: 'var(--c-t3)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user?.email}
                </div>
              </div>
            )}
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              background: 'var(--c-card2)',
              border: '1px solid var(--c-b2)',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '4px',
              boxShadow: '0 4px 20px var(--c-shadow)',
              minWidth: collapsed ? '140px' : 'unset',
            }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--c-danger)',
                  transition: 'background 0.1s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--c-hover)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
