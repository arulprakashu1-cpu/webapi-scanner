import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useQuery } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import { Sun, Moon, ChevronRight, Search, Plus, Download, Menu, PanelLeftClose } from 'lucide-react'
import { useState } from 'react'

function getBreadcrumb(pathname: string): string[] {
  if (pathname === '/' || pathname === '') return ['Home']
  if (pathname === '/dashboard') return ['Dashboard']
  if (pathname === '/scans/new') return ['Scans', 'New Scan']
  if (pathname.startsWith('/scans/')) return ['Scans', 'Scan Detail']
  if (pathname === '/scans') return ['Scans']
  if (pathname === '/targets') return ['Endpoints']
  if (pathname === '/reports') return ['Reports']
  if (pathname === '/login') return ['Sign In']
  if (pathname === '/register') return ['Register']
  const parts = pathname.split('/').filter(Boolean)
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
}

export default function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const { open, toggle } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const crumbs = getBreadcrumb(location.pathname)
  const [search, setSearch] = useState('')

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: scansApi.list,
    staleTime: 10_000,
    refetchInterval: 5_000,
  })

  const hasRunning = scans.some((s: any) => s.status === 'running' || s.status === 'queued')

  return (
    <header className="topbar">
      {/* Sidebar toggle + Breadcrumb + live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="theme-toggle" onClick={toggle} title={open ? 'Collapse sidebar' : 'Expand sidebar'}>
          {open ? <PanelLeftClose size={14} /> : <Menu size={14} />}
        </button>
        {hasRunning && <span className="live-dot" title="Scan in progress" />}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {crumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {i > 0 && <ChevronRight size={11} style={{ color: 'var(--text-dim)' }} />}
              <span style={{
                fontSize: '13px',
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
                color: i === crumbs.length - 1 ? 'var(--text-head)' : 'var(--text-muted)',
              }}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search */}
        <div className="tb-search">
          <Search size={13} />
          <input
            placeholder="Search scans…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                navigate(`/scans?q=${encodeURIComponent(search.trim())}`)
                setSearch('')
              }
            }}
          />
        </div>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Export */}
        <button className="tb-btn tb-ghost" title="Export">
          <Download size={14} />
          Export
        </button>

        {/* New Scan */}
        <button
          className="tb-btn tb-primary"
          onClick={() => navigate('/scans/new')}
        >
          <Plus size={14} />
          New Scan
        </button>
      </div>
    </header>
  )
}
