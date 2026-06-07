import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2, Shield, Lock, CheckCircle, BarChart2, FileText, Zap, ArrowRight } from 'lucide-react'
import { PasswordInput } from '../components/PasswordInput'
import { CaptchaField } from '../components/CaptchaField'
import { useAuth } from '../hooks/useAuth'
import { useGlobalToast } from '../App'


const FEATURES = [
  { icon: Shield,    color: '#F5A623', bg: 'rgba(245,166,35,0.1)',  title: '14 Security Headers', desc: 'Full OWASP coverage — A+ to F grading with actionable remediation.' },
  { icon: BarChart2, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  title: 'Scan History',        desc: 'Track improvements over time with detailed per-scan comparisons.' },
  { icon: FileText,  color: '#34D399', bg: 'rgba(52,211,153,0.1)',  title: 'PDF & JSON Reports',  desc: 'Export professional reports for compliance and stakeholder review.' },
  { icon: Zap,       color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', title: 'VirusTotal Check',    desc: 'URL reputation across 70+ engines in every scan.' },
]

const STATS = [
  { value: '14', label: 'Headers' },
  { value: 'A+',  label: 'Best Grade' },
  { value: '70+', label: 'VT Engines' },
  { value: 'Free', label: 'Always' },
]

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useGlobalToast()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return setError('Please complete the CAPTCHA')
    setError('')
    setLoading(true)
    try {
      const { require_password_change } = await login(email, password, captchaToken)
      if (require_password_change) navigate('/change-expired-password')
      else { toast.addToast('Welcome back!', 'success'); navigate('/dashboard') }
    } catch (err: any) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || 'Sign in failed. Please try again.'
      if (status === 423) setError(detail)
      else if (status === 403) setError('Please verify your email before signing in.')
      else setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Left Panel ── */}
      <div style={{
        flex: '0 0 56%',
        flexDirection: 'column', position: 'relative', overflow: 'hidden',
        padding: '48px 56px',
        background: 'linear-gradient(150deg, #0D1117 0%, #0A0D13 40%, #0D1117 100%)',
        borderRight: '1px solid #30363D',
      }} className="hidden lg:flex">

        {/* Background glows */}
        <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '65%', height: '65%', background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-8%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '45%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ marginBottom: '60px', position: 'relative', zIndex: 1 }}>
          <img src="/logo-white.svg" alt="GozoBee" style={{ height: '32px', display: 'block' }} />
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: '44px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.18)',
            borderRadius: '99px', padding: '4px 12px', marginBottom: '20px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5A623' }} />
            <span style={{ fontSize: '11px', color: '#F5A623', fontWeight: 700, letterSpacing: '0.05em' }}>Free — no credit card needed</span>
          </div>
          <h1 style={{ fontSize: '44px', fontWeight: 900, color: '#F4F4F5', lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '18px' }}>
            Detect Security<br />
            <span style={{ background: 'linear-gradient(90deg, #F5A623, #FDB94A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Header Gaps
            </span>
          </h1>
          <p style={{ fontSize: '15.5px', color: 'rgba(244,244,245,0.4)', lineHeight: 1.7, maxWidth: '400px' }}>
            Monitor HTTP security headers, track improvements over time, and get actionable remediation guides — free forever.
          </p>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '36px', position: 'relative', zIndex: 1 }}>
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', padding: '18px',
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,166,35,0.2)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              <div style={{ width: '32px', height: '32px', background: bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Icon size={15} color={color} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4F4F5', marginBottom: '4px' }}>{title}</div>
              <div style={{ fontSize: '11.5px', color: 'rgba(244,244,245,0.36)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden',
          position: 'relative', zIndex: 1,
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.018)', padding: '16px', textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#F5A623', letterSpacing: '-0.02em', marginBottom: '3px' }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(244,244,245,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', position: 'relative',
        background: '#0D1117',
      }}>

        {/* Top badges */}
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '6px' }}>
          {['Free Plan', 'No Credit Card'].map((b) => (
            <span key={b} style={{
              fontSize: '9.5px', fontWeight: 800, color: 'rgba(245,166,35,0.45)',
              border: '1px solid rgba(245,166,35,0.12)', borderRadius: '6px',
              padding: '3px 8px', letterSpacing: '0.05em',
            }}>{b}</span>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Mobile logo */}
          <div style={{ marginBottom: '32px' }} className="flex lg:hidden">
            <img src="/logo-white.svg" alt="GozoBee" style={{ height: '26px', display: 'block' }} />
          </div>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px',
                background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock size={16} color="#F5A623" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={13} color="#34D399" />
                <span style={{ fontSize: '11.5px', color: '#34D399', fontWeight: 600 }}>Secure connection</span>
              </div>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#F4F4F5', letterSpacing: '-0.025em', marginBottom: '5px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '13.5px', color: 'rgba(244,244,245,0.38)' }}>
              Sign in to your GozoBee workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>Email address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(13,17,23,0.8)', border: '1px solid #30363D',
                  borderRadius: '10px', padding: '12px 14px', fontSize: '14px',
                  color: '#F4F4F5', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(245,166,35,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)' }}
                onBlur={(e) => { e.target.style.borderColor = '#30363D'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: '#F5A623', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <PasswordInput value={password} onChange={setPassword} placeholder="Your password" required />
            </div>

            <CaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '11px 14px', color: '#F87171', fontSize: '12.5px' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken}
              style={{
                width: '100%', padding: '13px', fontSize: '14px', fontWeight: 700, borderRadius: '11px',
                background: loading || !captchaToken ? 'rgba(245,166,35,0.35)' : 'linear-gradient(135deg, #F5A623, #E8941A)',
                color: '#1A0A00', border: 'none', cursor: loading || !captchaToken ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading || !captchaToken ? 'none' : '0 4px 20px rgba(245,166,35,0.4)',
                transition: 'all 0.15s', marginTop: '4px',
              }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Signing in…</>
                : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(244,244,245,0.36)', marginTop: '20px' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#F5A623', fontWeight: 700, textDecoration: 'none' }}>Create free account</Link>
          </p>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #30363D', textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: '12px', color: 'rgba(244,244,245,0.28)', textDecoration: 'none' }}>
              ← Back to public scanner
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
