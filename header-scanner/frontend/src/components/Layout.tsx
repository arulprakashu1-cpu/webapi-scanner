import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, User, LogOut, Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: React.ReactNode
}


export function Layout({ children }: Props) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ]

  const initial = user?.first_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Navbar */}
      <nav style={{
        background: '#161B22',
        borderBottom: '1px solid #30363D',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center">
            <img src="/logo-white.svg" alt="GozoBee" style={{ height: '28px', display: 'block' }} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((l) => {
              const active = location.pathname === l.to || (l.to === '/dashboard' && location.pathname.startsWith('/dashboard'))
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-accent/12 text-accent font-semibold'
                      : 'text-muted hover:text-head hover:bg-elevated'
                  }`}
                  style={active ? { boxShadow: '0 0 0 1px rgba(245,166,35,0.2)' } : {}}
                >
                  {l.icon}{l.label}
                </Link>
              )
            })}

            <div className="w-px h-5 bg-border-warm mx-2" />

            {/* Upgrade pill */}
            {user?.plan === 'free' && (
              <a
                href="http://localhost:5173/register"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-bold mr-1"
                style={{
                  background: 'linear-gradient(135deg, #F5A623, #E8941A)',
                  color: '#1A0A00',
                  boxShadow: '0 2px 12px rgba(245,166,35,0.4)',
                }}
              >
                <Zap className="w-3 h-3" /> Upgrade to Pro
              </a>
            )}

            {/* User chip */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[9px]" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid #30363D' }}>
              <div
                className="w-7 h-7 rounded-full text-[#1A0A00] text-xs font-black flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F5A623, #E8941A)' }}
              >
                {initial}
              </div>
              <div className="text-xs leading-tight">
                <div className="text-head font-semibold">{user?.first_name} {user?.last_name}</div>
                <div className="text-muted capitalize text-[10px]">{user?.plan} plan</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[12.5px] text-muted hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-muted p-2 rounded-[9px] hover:bg-elevated hover:text-head transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border-warm px-4 py-3 space-y-1 animate-fade-up" style={{ background: '#161B22' }}>
            {navLinks.map((l) => {
              const active = location.pathname.startsWith(l.to)
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-[9px] text-sm ${
                    active ? 'bg-accent/12 text-accent font-semibold' : 'text-muted hover:text-head'
                  }`}
                >
                  {l.icon}{l.label}
                </Link>
              )
            })}
            {user?.plan === 'free' && (
              <a href="http://localhost:5173/register" className="flex items-center gap-2 px-3 py-2.5 rounded-[9px] text-sm font-bold text-[#1A0A00]" style={{ background: 'linear-gradient(135deg,#F5A623,#E8941A)' }}>
                <Zap className="w-3.5 h-3.5" /> Upgrade to Pro
              </a>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-[9px] text-sm text-red-400 w-full">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
