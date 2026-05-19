import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import {
  Shield, Zap, FileText, Lock, Check, Search, Globe,
  AlertTriangle, Sun, Moon, ChevronDown, ChevronUp,
  Star, Users, Phone,
} from 'lucide-react'

const FEATURES = [
  { icon: Zap, color: '#FFD600', title: 'Instant Scanning', desc: 'Paste a URL or upload your OpenAPI spec. Scan starts immediately with real-time progress.' },
  { icon: Shield, color: '#60A5FA', title: 'OWASP API Top 10', desc: 'All 10 OWASP API Security categories tested: BOLA, broken auth, injections, SSRF & more.' },
  { icon: FileText, color: '#22C55E', title: 'Detailed Reports', desc: 'Every finding has severity, OWASP category, CWE ID, affected endpoint, and remediation.' },
  { icon: Lock, color: '#B482FF', title: 'Auth Support', desc: 'Scan with API Keys, Bearer tokens, or unauthenticated. Credentials never stored.' },
  { icon: FileText, color: '#FF8C00', title: 'JSON & CSV Export', desc: 'Download findings in JSON or CSV for your ticketing system or SIEM.' },
  { icon: Shield, color: '#FF4444', title: 'Secure by Design', desc: 'Scans run in isolation. Tokens used ephemerally. Your target data stays private.' },
]

const PRICING = [
  {
    name: 'FREE',
    price: '$0',
    period: '/mo',
    highlight: false,
    features: [
      '8 scans/mo',
      'Basic reports',
      'JSON/CSV export',
      'OWASP Top 10 coverage',
      'Community support',
    ],
    cta: 'Get started',
    ctaLink: '/register',
    ctaStyle: 'outline',
  },
  {
    name: 'PRO',
    price: '$29',
    period: '/mo',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Unlimited scans',
      'Scheduled scans',
      'Team access (5)',
      'Priority support',
      'API access',
      'PDF reports',
    ],
    cta: 'Start Pro trial',
    ctaLink: '/register',
    ctaStyle: 'yellow',
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    period: '',
    highlight: false,
    features: [
      'Unlimited',
      'Custom rules',
      'SSO + SAML',
      'SLA + Support',
      'Dedicated CSM',
      'Custom reports',
    ],
    cta: 'Contact sales',
    ctaLink: '/register',
    ctaStyle: 'outline',
  },
]

const FAQS = [
  {
    q: 'Is my API data stored after scanning?',
    a: 'No. Auth tokens and request data are used ephemerally during the scan and are never persisted to disk or database. Your target API data stays private.',
  },
  {
    q: 'What OWASP vulnerabilities does ScanAPI cover?',
    a: 'ScanAPI tests all 10 OWASP API Security Top 10 categories including BOLA, Broken Authentication, Excessive Data Exposure, Lack of Resources, SSRF, Security Misconfiguration, and more.',
  },
  {
    q: 'Can I scan APIs that require authentication?',
    a: 'Yes. ScanAPI supports Bearer token, API Key header, and unauthenticated scanning. Credentials are used only during the scan session and never stored.',
  },
  {
    q: 'How long does a scan take?',
    a: 'Most scans complete in under 5 minutes depending on the number of endpoints. Real-time progress is shown in the dashboard.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [url, setUrl] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleScan = () => {
    navigate('/login')
  }

  const handleScanCurrentPage = () => {
    navigate('/login')
  }

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh', color: 'var(--c-t1)' }}>

      {/* ── A) Nav ── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: theme === 'dark' ? 'rgba(10,10,10,0.88)' : 'rgba(255,255,255,0.88)',
        borderBottom: '1px solid var(--c-b1)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <img
            src={theme === 'dark' ? '/logo-white.svg' : '/logo-dark.svg'}
            alt="GozoBee"
            style={{ height: '28px', display: 'block' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              style={{
                width: '34px', height: '34px',
                borderRadius: '8px',
                background: 'none',
                border: '1px solid var(--c-b2)',
                cursor: 'pointer',
                color: 'var(--c-t2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/login" style={{ fontSize: '13.5px', color: 'var(--c-t2)', fontWeight: 500, padding: '8px 16px', textDecoration: 'none' }}>
              Sign in
            </Link>
            <Link
              to="/register"
              style={{
                fontSize: '13px', padding: '8px 18px', borderRadius: '10px',
                background: 'var(--c-accent)', color: '#000', fontWeight: 700,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
              }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── B) Hero ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 40px 60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)',
          color: 'var(--c-accent)', fontSize: '12px', fontWeight: 600,
          padding: '6px 14px', borderRadius: '99px', marginBottom: '32px',
        }}>
          <AlertTriangle size={13} />
          OWASP API Top 10 Coverage
        </div>

        <h1 style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1.08, marginBottom: '20px', letterSpacing: '-0.02em', color: 'var(--c-t1)' }}>
          Find API Security<br />
          <span style={{ color: 'var(--c-accent)' }}>Vulnerabilities</span> Before<br />
          Attackers Do
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--c-t3)', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          Point ScanAPI at your REST API endpoint. Get a detailed OWASP-mapped security report with severity ratings and remediation steps in minutes.
        </p>

        {/* Hero scan input card */}
        <div style={{
          maxWidth: '540px', margin: '0 auto',
          background: 'var(--c-card)', border: '1px solid var(--c-b2)',
          borderRadius: '16px', padding: '20px',
        }}>
          <div style={{
            fontSize: '11px', color: 'var(--c-accent)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Globe size={12} />
            Enter URL
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              style={{
                flex: 1, background: 'var(--c-input)', border: '1px solid var(--c-b2)',
                color: 'var(--c-t1)', borderRadius: '10px', padding: '10px 14px',
                fontSize: '13px', outline: 'none',
              }}
              placeholder="https://api.example.com/v1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)')}
              onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)')}
            />
            <button
              onClick={handleScan}
              style={{
                background: 'var(--c-accent)', color: '#000',
                border: 'none', borderRadius: '10px',
                padding: '10px 16px', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Search size={14} />
              Scan URL
            </button>
          </div>
          <button
            onClick={handleScanCurrentPage}
            style={{
              width: '100%', background: 'var(--c-b1)', color: 'var(--c-t1)',
              border: '1px solid var(--c-b2)', borderRadius: '10px',
              padding: '9px', fontWeight: 600, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <Globe size={13} />
            Scan Current Page
          </button>
          <p style={{ fontSize: '11px', color: 'var(--c-t4)', marginTop: '10px' }}>
            Demo login:{' '}
            <Link to="/login" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>demo@scanapi.io</Link>
            {' '}/ demo1234
          </p>
        </div>
      </section>

      {/* ── C) Stats bar ── */}
      <div style={{ borderTop: '1px solid var(--c-b1)', borderBottom: '1px solid var(--c-b1)', padding: '28px 40px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {[
            { value: 'Top 10', label: 'OWASP categories covered' },
            { value: '< 5 min', label: 'Average scan time' },
            { value: 'JSON + CSV', label: 'Export formats' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '0 24px',
              borderRight: i < 2 ? '1px solid var(--c-b1)' : 'none',
            }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--c-accent)' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--c-t3)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── D) Features ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '72px 40px' }}>
        <h2 style={{ fontSize: '30px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: 'var(--c-t1)' }}>
          Everything you need to <span style={{ color: 'var(--c-accent)' }}>secure your API</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--c-t3)', fontSize: '14px', marginBottom: '48px' }}>
          From scan creation to remediation guidance — a complete API security workflow.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              style={{
                background: 'var(--c-card)',
                border: '1px solid var(--c-b1)',
                borderRadius: '14px',
                padding: '22px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b3)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b1)')}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <Icon size={18} color={color} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '8px', color: 'var(--c-t1)' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--c-t3)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── E) Pricing Plans ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 40px 80px' }}>
        <h2 style={{ fontSize: '30px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: 'var(--c-t1)' }}>
          Pricing <span style={{ color: 'var(--c-accent)' }}>Plans</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--c-t3)', fontSize: '14px', marginBottom: '48px' }}>
          Start free. Scale as you grow. Cancel any time.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: 'var(--c-card)',
                border: plan.highlight ? '2px solid var(--c-accent)' : '1px solid var(--c-b1)',
                borderRadius: '16px',
                padding: plan.highlight ? '28px' : '24px',
                position: 'relative',
                boxShadow: plan.highlight ? '0 0 32px var(--c-accent-bg)' : 'none',
                transform: plan.highlight ? 'scale(1.02)' : 'none',
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--c-accent)', color: '#000', fontWeight: 700, fontSize: '11px',
                  padding: '4px 14px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px',
                  whiteSpace: 'nowrap',
                }}>
                  <Star size={10} strokeWidth={2.5} />
                  {plan.badge}
                </div>
              )}

              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                {plan.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
                <span style={{ fontSize: '40px', fontWeight: 900, color: 'var(--c-t1)', lineHeight: 1 }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: '14px', color: 'var(--c-t3)' }}>{plan.period}</span>}
              </div>
              <div style={{ width: '32px', height: '2px', background: 'var(--c-accent)', margin: '16px 0' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--c-t2)' }}>
                    <Check size={13} color="var(--c-accent)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={plan.ctaLink}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '11px', borderRadius: '10px',
                  fontSize: '13.5px', fontWeight: 700, textDecoration: 'none',
                  background: plan.ctaStyle === 'yellow' ? 'var(--c-accent)' : 'transparent',
                  color: plan.ctaStyle === 'yellow' ? '#000' : 'var(--c-accent)',
                  border: plan.ctaStyle === 'yellow' ? 'none' : '1px solid var(--c-accent)',
                  boxSizing: 'border-box',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                {plan.name === 'ENTERPRISE' ? <><Phone size={13} style={{ marginRight: '6px' }} />{plan.cta}</> :
                 plan.name === 'PRO' ? <><Users size={13} style={{ marginRight: '6px' }} />{plan.cta}</> :
                 plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── F) FAQ ── */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '0 40px 80px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: 'var(--c-t1)' }}>
          Frequently Asked <span style={{ color: 'var(--c-accent)' }}>Questions</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--c-t3)', fontSize: '14px', marginBottom: '40px' }}>
          Everything you need to know about ScanAPI.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                background: 'var(--c-card)',
                border: '1px solid var(--c-b1)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '16px 18px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--c-t1)',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
              >
                {faq.q}
                {openFaq === i
                  ? <ChevronUp size={16} style={{ flexShrink: 0, color: 'var(--c-accent)' }} />
                  : <ChevronDown size={16} style={{ flexShrink: 0, color: 'var(--c-t3)' }} />}
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 18px 16px', fontSize: '13.5px', color: 'var(--c-t2)', lineHeight: 1.65 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── G) Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--c-b1)',
        padding: '24px 40px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={theme === 'dark' ? '/logo-white.svg' : '/logo-dark.svg'}
              alt="GozoBee"
              style={{ height: '22px', opacity: 0.75 }}
            />
            <span style={{ fontSize: '12px', color: 'var(--c-t4)' }}>· 2026 · API Security Scanner</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy', 'Terms', 'Docs', 'Status'].map((link) => (
              <Link key={link} to="/" style={{ fontSize: '12.5px', color: 'var(--c-t3)', textDecoration: 'none' }}>
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
