import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle, Check, Shield, Hexagon, ArrowRight } from 'lucide-react'

const FREE_PORT = 'http://localhost:5174/register'


export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro')
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedPlan === 'free') {
      window.location.href = FREE_PORT
      return
    }

    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.full_name)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <img src="/logo-white.svg" alt="GozoBee" style={{ height: '30px' }}/>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(230,237,243,0.45)' }}>Create your account — choose a plan to get started</p>
        </div>

        {/* Plan selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {/* Free plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan('free')}
            style={{
              border: selectedPlan === 'free' ? '2px solid rgba(96,165,250,0.6)' : '1px solid rgba(230,237,243,0.1)',
              borderRadius: '14px', padding: '16px', textAlign: 'left', cursor: 'pointer',
              background: selectedPlan === 'free' ? 'rgba(96,165,250,0.07)' : 'rgba(230,237,243,0.025)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Hexagon size={16} color="#60A5FA" />
              {selectedPlan === 'free' && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" strokeWidth={3} /></div>}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#E6EDF3', marginBottom: '2px' }}>Free</div>
            <div style={{ fontSize: '11.5px', color: '#60A5FA', fontWeight: 600 }}>$0/mo</div>
            <div style={{ fontSize: '11px', color: 'rgba(230,237,243,0.4)', marginTop: '4px', lineHeight: 1.4 }}>Header Scanner v1</div>
          </button>

          {/* Pro plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan('pro')}
            style={{
              border: selectedPlan === 'pro' ? '2px solid rgba(245,166,35,0.6)' : '1px solid rgba(230,237,243,0.1)',
              borderRadius: '14px', padding: '16px', textAlign: 'left', cursor: 'pointer',
              background: selectedPlan === 'pro' ? 'rgba(245,166,35,0.07)' : 'rgba(230,237,243,0.025)',
              transition: 'all 0.15s', position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: '-9px', right: '12px', background: '#F5A623', color: '#1A1109', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>POPULAR</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Shield size={16} color="#F5A623" />
              {selectedPlan === 'pro' && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#1A1109" strokeWidth={3} /></div>}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#E6EDF3', marginBottom: '2px' }}>Pro</div>
            <div style={{ fontSize: '11.5px', color: '#F5A623', fontWeight: 600 }}>$29/mo</div>
            <div style={{ fontSize: '11px', color: 'rgba(230,237,243,0.4)', marginTop: '4px', lineHeight: 1.4 }}>API Scanner + all Free</div>
          </button>
        </div>

        {/* Form */}
        <div style={{ background: 'rgba(230,237,243,0.03)', border: '1px solid rgba(230,237,243,0.09)', borderRadius: '18px', padding: '24px' }}>
          {selectedPlan === 'free' ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(96,165,250,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Hexagon size={22} color="#60A5FA" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#E6EDF3', marginBottom: '6px' }}>Header Scanner v1 — Free</h3>
              <p style={{ fontSize: '13px', color: 'rgba(230,237,243,0.45)', lineHeight: 1.6, marginBottom: '20px' }}>
                Instantly analyze security headers, get VirusTotal checks, and save up to 2 domain profiles.
              </p>
              <a
                href={FREE_PORT}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.4)', color: '#60A5FA', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                Create Free Account <ArrowRight size={14} />
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '12.5px', padding: '10px 12px', borderRadius: '10px' }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(230,237,243,0.45)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full name</label>
                <input
                  type="text"
                  placeholder="Alex Chen"
                  value={form.full_name}
                  onChange={set('full_name')}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(230,237,243,0.04)', border: '1px solid rgba(230,237,243,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#E6EDF3', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(245,166,35,0.45)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(230,237,243,0.1)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(230,237,243,0.45)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(230,237,243,0.04)', border: '1px solid rgba(230,237,243,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#E6EDF3', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(245,166,35,0.45)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(230,237,243,0.1)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(230,237,243,0.45)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={6}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(230,237,243,0.04)', border: '1px solid rgba(230,237,243,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#E6EDF3', outline: 'none' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(245,166,35,0.45)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(230,237,243,0.1)')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '10px',
                  background: '#F5A623', color: '#1A1109', border: 'none', cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                    Creating account…
                  </>
                ) : 'Create Pro Account'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'rgba(230,237,243,0.35)', marginTop: '16px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#F5A623', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
