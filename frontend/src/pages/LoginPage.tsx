import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Eye, EyeOff, AlertCircle, Search } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@scanapi.io')
    setPassword('demo1234')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Brand card */}
        <div style={{
          background: 'var(--c-card2)', border: '1px solid var(--c-b1)',
          borderRadius: '18px', padding: '28px', marginBottom: '16px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <img
              src={theme === 'dark' ? '/logo-white.svg' : '/logo-dark.svg'}
              alt="GozoBee"
              style={{ height: '32px' }}
            />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--c-t3)' }}>Sign in to your workspace</p>
        </div>

        {/* Login card */}
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '18px', padding: '24px' }}>

          {/* Demo shortcut */}
          <button
            type="button"
            onClick={fillDemo}
            style={{
              width: '100%', marginBottom: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px',
              background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)',
              borderRadius: '10px', color: 'var(--c-accent)',
              fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,214,0,0.14)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--c-accent-bg)')}
          >
            <Search size={13} />
            Use demo account (demo@scanapi.io)
          </button>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid var(--c-b1)' }} />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: 'var(--c-card)', padding: '0 12px', fontSize: '11px', color: 'var(--c-t4)' }}>or sign in</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--c-danger)', fontSize: '12.5px', padding: '10px 12px', borderRadius: '10px',
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  style={{ paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-t3)',
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-yellow"
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '10px', marginTop: '4px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                    borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block',
                  }} />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--c-t3)', marginTop: '16px' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>Create one free</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
