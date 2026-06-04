import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  Eye, EyeOff, AlertCircle, Search, Zap, Shield, BarChart3,
  Brain, Clock, CheckCircle, Globe, Lock, ArrowRight,
} from 'lucide-react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const SITE_KEY = '1x00000000000000000000AA'

const FEATURES = [
  {
    icon: Shield,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    title: 'OWASP API Top 10',
    desc: 'Full coverage of every category — BOLA, broken auth, SSRF, injection and more',
  },
  {
    icon: Zap,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    title: 'Results in Under 60s',
    desc: 'Real-time scanner with parallel endpoint probing and live progress tracking',
  },
  {
    icon: Brain,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    title: 'AI-Powered Analysis',
    desc: 'Claude AI generates attack narratives, risk scores, and remediation roadmaps',
  },
  {
    icon: BarChart3,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    title: 'Compliance Reports',
    desc: 'Export PDF, JSON, and CSV reports ready for SOC2, PCI-DSS, and HIPAA audits',
  },
]

const STATS = [
  { value: '12,847', label: 'APIs Scanned' },
  { value: '94,320', label: 'Vulnerabilities Found' },
  { value: '1,240', label: 'Teams Protected' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const ACTIVITY = [
  { host: 'api.stripe.com', time: '2 min ago', sev: 'low',    count: 2 },
  { host: 'auth.service.io', time: '5 min ago', sev: 'high',   count: 7 },
  { host: 'payments.xyz',    time: '9 min ago', sev: 'medium', count: 4 },
  { host: 'graph.facebook.com', time: '12 min ago', sev: 'low', count: 1 },
  { host: 'api.github.com',  time: '18 min ago', sev: 'info',  count: 3 },
]

const SEV_COLOR: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#10b981', info: '#60a5fa',
}

export default function LoginPage() {
  const { login } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [captchaReady, setCaptchaReady] = useState(false)
  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load Turnstile script and render widget
  useEffect(() => {
    const existing = document.getElementById('cf-turnstile-script')
    if (!existing) {
      const s = document.createElement('script')
      s.id = 'cf-turnstile-script'
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      document.head.appendChild(s)
    }

    const tryRender = () => {
      if (window.turnstile && containerRef.current && !widgetRef.current) {
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => { setCaptchaToken(token); setCaptchaReady(true) },
          'expired-callback': () => { setCaptchaToken(''); setCaptchaReady(false) },
          'error-callback':   () => { setCaptchaToken(''); setCaptchaReady(false) },
          theme: 'dark',
          size: 'flexible',
        })
      } else if (!window.turnstile) {
        setTimeout(tryRender, 300)
      }
    }
    setTimeout(tryRender, 500)

    return () => {
      if (window.turnstile && widgetRef.current) {
        try { window.turnstile.remove(widgetRef.current) } catch {}
        widgetRef.current = null
      }
    }
  }, [])

  const resetCaptcha = () => {
    setCaptchaToken('')
    setCaptchaReady(false)
    if (window.turnstile && widgetRef.current) {
      window.turnstile.reset(widgetRef.current)
    }
  }

  const fillDemo = () => { setEmail('demo@scanapi.io'); setPassword('demo1234') }
  const fillPro  = () => { setEmail('pro@scanapi.io');  setPassword('pro1234')  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, captchaToken || undefined)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password')
      resetCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#0a0b0d',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>

      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <div style={{
        flex: '0 0 58%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #0d0f12 0%, #111318 50%, #0d1117 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }}>
        {/* background glow blobs */}
        <div style={{ position: 'absolute', top: '-120px', left: '-80px', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '80px', right: '-60px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--c-accent-bg) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '64px', position: 'relative', zIndex: 1 }}>
          <img
            src={theme === 'dark' ? '/logo-white.svg' : '/logo-white.svg'}
            alt="GozoBee"
            style={{ height: '34px' }}
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement
              t.style.display = 'none'
              const next = t.nextElementSibling as HTMLElement
              if (next) next.style.display = 'flex'
            }}
          />
          <div style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--brand)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#000" />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>GozoBee</span>
          </div>
          <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Security Platform</span>
        </div>

        {/* Hero text */}
        <div style={{ marginBottom: '48px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '99px', padding: '4px 12px', marginBottom: '20px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', animation: 'glow-pulse 2s infinite' }} />
            <span style={{ fontSize: '11.5px', color: '#60a5fa', fontWeight: 600 }}>Enterprise API Security</span>
          </div>
          <h1 style={{
            fontSize: '44px', fontWeight: 900, color: '#fff', lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: '18px',
          }}>
            Secure Your APIs<br />
            <span style={{ background: 'linear-gradient(90deg, var(--brand), #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Before Attackers Do
            </span>
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: '520px' }}>
            Detect OWASP API Top 10 vulnerabilities in under 60 seconds. AI-powered analysis.
            Compliance-ready reports. Built for engineering teams that move fast.
          </p>
        </div>

        {/* Feature grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          marginBottom: '48px', position: 'relative', zIndex: 1,
        }}>
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '18px',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '30px', height: '30px', background: bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{title}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px',
          background: 'rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)', marginBottom: '32px',
          position: 'relative', zIndex: 1,
        }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.02)', padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Live activity feed */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'glow-pulse 1.5s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Scan Activity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ACTIVITY.map(({ host, time, sev, count }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px', padding: '10px 14px',
              }}>
                <Globe size={13} color="rgba(255,255,255,0.3)" />
                <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>{host}</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: SEV_COLOR[sev], background: `${SEV_COLOR[sev]}18`, padding: '2px 8px', borderRadius: '5px' }}>
                  {count} {sev}
                </span>
                <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.25)' }}>{time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust bar */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>TRUSTED BY SECURITY TEAMS AT</span>
            {['Fintech Corp', 'SecureOps', 'CloudNine', 'DevSec Labs', 'API Shield'].map((name) => (
              <span key={name} style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (login form) ───────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0d0f12', padding: '40px 48px',
        position: 'relative',
      }}>
        {/* Corner compliance badges */}
        <div style={{ position: 'absolute', top: '28px', right: '28px', display: 'flex', gap: '8px' }}>
          {['SOC2', 'GDPR', 'ISO27001'].map((badge) => (
            <span key={badge} style={{
              fontSize: '9.5px', fontWeight: 800, color: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px',
              padding: '3px 8px', letterSpacing: '0.06em',
            }}>{badge}</span>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={16} color="var(--brand)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={13} color="#10b981" />
                <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600 }}>Secure connection</span>
              </div>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
              Sign in to your security workspace
            </p>
          </div>

          {/* Demo account shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={fillDemo}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Search size={12} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Free Demo</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>FREE</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>demo@scanapi.io</span>
            </button>
            <button
              type="button"
              onClick={fillPro}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px',
                padding: '12px 14px',
                background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)',
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--c-accent-bg)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--c-accent-bg)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={12} color="var(--brand)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)' }}>Pro Demo</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 800, background: 'var(--brand)', color: '#000', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>PRO</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--c-accent-br)', fontFamily: 'monospace' }}>pro@scanapi.io</span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: '#0d0f12', padding: '0 14px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>or sign in with your account</span>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', fontSize: '12.5px', padding: '11px 14px', borderRadius: '10px',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '12px 14px', fontSize: '14px',
                  color: '#fff', outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--c-accent-br)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '12px 44px 12px 14px', fontSize: '14px',
                    color: '#fff', outline: 'none', transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--c-accent-br)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '4px' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Cloudflare Turnstile */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Security Verification
              </label>
              <div
                ref={containerRef}
                style={{ borderRadius: '10px', overflow: 'hidden', minHeight: '65px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {!captchaReady && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '18px', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.4)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Loading verification…
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-yellow"
              style={{ width: '100%', padding: '13px', marginTop: '4px', fontSize: '14px', borderRadius: '12px' }}
            >
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Verifying…
                </>
              ) : (
                <>
                  Sign in to workspace
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
              No account?{' '}
              <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
                Start free — no credit card
              </Link>
            </p>
          </div>

          {/* Security note */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { icon: Lock, text: 'TLS 1.3 Encrypted' },
              { icon: Shield, text: 'Cloudflare Protected' },
              { icon: Clock, text: '99.9% Uptime' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon size={11} color="rgba(255,255,255,0.2)" />
                <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
          50% { opacity: 0.6; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,0.04) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
        }
      `}</style>
    </div>
  )
}
