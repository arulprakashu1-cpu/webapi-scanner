import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Zap, FileText, Lock, Check, Globe,
  ChevronDown, ChevronUp,
  Star, ArrowRight, Hexagon, Activity, BarChart3,
} from 'lucide-react'

const FREE_PORT = 'http://localhost:5174'


const FREE_FEATURES = [
  '14 security headers analyzed',
  'A+ to F grading (OWASP-aligned)',
  'VirusTotal reputation check',
  '2 domains / 2 scans per day',
  'Full remediation guides',
  'Email security (DMARC/SPF)',
]

const PRO_FEATURES = [
  'OWASP API Top 10 full coverage',
  'BOLA, Broken Auth, SSRF, Injection',
  'AI-powered attack narratives',
  'Unlimited scans & targets',
  'PDF / JSON / CSV reports',
  'SOC2, PCI-DSS audit-ready',
]

const ALL_FEATURES = [
  { icon: Shield, color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', title: 'Security Header Scanner', desc: 'Check 14 HTTP security headers. Get A+ to F grade with full OWASP remediation guidance. Free, no account needed.', tier: 'Free' },
  { icon: Zap, color: '#F5A623', bg: 'rgba(245,166,35,0.12)', title: 'OWASP API Top 10', desc: 'Full coverage of every OWASP API Security category — BOLA, broken auth, SSRF, injection and more.', tier: 'Pro' },
  { icon: Activity, color: '#34d399', bg: 'rgba(52,211,153,0.12)', title: 'VirusTotal Analysis', desc: 'URL reputation check against 70+ security engines — malicious URL and phishing detection included.', tier: 'Free' },
  { icon: BarChart3, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', title: 'AI-Powered Reports', desc: 'Claude AI generates attack narratives, risk scores, and remediation roadmaps for every finding.', tier: 'Pro' },
  { icon: FileText, color: '#f87171', bg: 'rgba(248,113,113,0.12)', title: 'Compliance Exports', desc: 'Download PDF, JSON, and CSV reports ready for SOC2, PCI-DSS, and HIPAA audits.', tier: 'Pro' },
  { icon: Lock, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', title: 'Auth-Aware Scanning', desc: 'Scan APIs with Bearer tokens, API Keys, or unauthenticated. Credentials are never stored.', tier: 'Pro' },
]

const FAQS = [
  { q: 'What is the free Header Scanner?', a: 'The Header Scanner v1 checks 14 HTTP security headers on any URL instantly — no account required. You get an A+ to F grade, VirusTotal reputation, and full remediation steps. Up to 2 saved domains and 2 scans/day with a free account.' },
  { q: 'What does the Pro API Scanner add?', a: 'The Pro API Scanner tests your REST API against all 10 OWASP API Security categories including BOLA, broken authentication, excessive data exposure, SSRF, and injection. It uses AI to generate attack narratives and creates compliance-ready PDF reports.' },
  { q: 'Is my API data stored after scanning?', a: 'No. Auth tokens and request data are used ephemerally during the scan and are never persisted. Your target API data stays private.' },
  { q: 'Can I use one account for both products?', a: 'Yes. Create one GozoBee account. Free users get Header Scanner v1 access. Pro users unlock the full API Scanner in addition to unlimited header scanning.' },
  { q: 'How long does an API scan take?', a: 'Most API scans complete in under 5 minutes depending on the number of endpoints. Header scans finish in seconds. Real-time progress is shown in the dashboard.' },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(13,17,23,0.97)',
        borderBottom: '1px solid rgba(48,54,61,0.8)',
      }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo-white.svg" alt="GozoBee" style={{ height: '30px' }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <a href="#products" style={{ fontSize: '12.5px', fontWeight: 600, padding: '6px 12px', color: 'rgba(230,237,243,0.55)', textDecoration: 'none' }}>Products</a>
            <a href="#features" style={{ fontSize: '12.5px', fontWeight: 600, padding: '6px 12px', color: 'rgba(230,237,243,0.55)', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ fontSize: '12.5px', fontWeight: 600, padding: '6px 12px', color: 'rgba(230,237,243,0.55)', textDecoration: 'none' }}>Pricing</a>
            <Link to="/login" style={{ fontSize: '12.5px', fontWeight: 600, padding: '6px 14px', color: 'rgba(230,237,243,0.55)', textDecoration: 'none', marginLeft: '6px' }}>Sign in</Link>
            <a href={FREE_PORT} style={{ fontSize: '12.5px', fontWeight: 700, padding: '8px 16px', borderRadius: '9px', border: '1px solid rgba(245,166,35,0.35)', color: '#F5A623', background: 'rgba(245,166,35,0.07)', textDecoration: 'none' }}>Try Free</a>
            <Link to="/register" style={{ fontSize: '12.5px', fontWeight: 700, padding: '8px 16px', borderRadius: '9px', background: '#F5A623', color: '#1A1109', textDecoration: 'none' }}>Get Pro</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '130px 40px 70px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)',
          color: '#F5A623', fontSize: '11.5px', fontWeight: 700,
          padding: '6px 16px', borderRadius: '99px', marginBottom: '32px',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Complete API & Web Security Platform
        </div>

        <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1.06, marginBottom: '22px', letterSpacing: '-0.03em', color: '#E6EDF3' }}>
          Secure Every Layer<br />
          <span style={{ background: 'linear-gradient(90deg, #F5A623, #FDB94A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            of Your Web Stack
          </span>
        </h1>

        <p style={{ fontSize: '17px', color: 'rgba(230,237,243,0.5)', maxWidth: '560px', margin: '0 auto 52px', lineHeight: 1.7 }}>
          From HTTP security headers to deep OWASP API Top 10 scanning — GozoBee covers your entire attack surface with one platform.
        </p>

        {/* Product Cards */}
        <div id="products" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '720px', margin: '0 auto', textAlign: 'left' }}>
          {/* Free Card */}
          <div style={{
            background: 'rgba(230,237,243,0.03)', border: '1px solid rgba(230,237,243,0.1)',
            borderRadius: '18px', padding: '28px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Hexagon size={18} color="#60A5FA" />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Free Forever</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#E6EDF3', marginBottom: '6px', letterSpacing: '-0.02em' }}>Header Scanner v1</h3>
            <p style={{ fontSize: '13px', color: 'rgba(230,237,243,0.45)', lineHeight: 1.6, marginBottom: '20px' }}>
              Instant HTTP security header analysis with A+ to F grading and VirusTotal checks.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FREE_FEATURES.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'rgba(230,237,243,0.6)' }}>
                  <Check size={13} color="#60A5FA" style={{ flexShrink: 0, marginTop: '1px' }} />{f}
                </li>
              ))}
            </ul>
            <a
              href={FREE_PORT}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', border: '1px solid rgba(96,165,250,0.4)', color: '#60A5FA', textDecoration: 'none', marginTop: 'auto' }}
            >
              Launch Free Scanner <ArrowRight size={13} />
            </a>
          </div>

          {/* Pro Card */}
          <div style={{
            background: '#161B22', border: '2px solid rgba(245,166,35,0.4)',
            borderRadius: '18px', padding: '28px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 0 40px rgba(245,166,35,0.08)', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
              background: '#F5A623', color: '#1A1109', fontWeight: 800, fontSize: '10.5px',
              padding: '4px 14px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
            }}>
              <Star size={10} strokeWidth={2.5} /> Most Popular
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={18} color="#F5A623" />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pro · $29/mo</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#E6EDF3', marginBottom: '6px', letterSpacing: '-0.02em' }}>API Security Scanner</h3>
            <p style={{ fontSize: '13px', color: 'rgba(230,237,243,0.45)', lineHeight: 1.6, marginBottom: '20px' }}>
              Deep OWASP API Top 10 scanning with AI-powered analysis and compliance reports.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRO_FEATURES.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'rgba(230,237,243,0.6)' }}>
                  <Check size={13} color="#F5A623" style={{ flexShrink: 0, marginTop: '1px' }} />{f}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', background: '#F5A623', color: '#1A1109', textDecoration: 'none', marginTop: 'auto' }}
            >
              Start Pro Trial <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: '1px solid rgba(230,237,243,0.07)', borderBottom: '1px solid rgba(230,237,243,0.07)', padding: '28px 40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          {[
            { value: '14', label: 'Headers analyzed' },
            { value: 'Top 10', label: 'OWASP categories' },
            { value: '< 5 min', label: 'Average scan time' },
            { value: 'A+', label: 'Best possible grade' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 20px', borderRight: i < 3 ? '1px solid rgba(230,237,243,0.07)' : 'none' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F5A623' }}>{stat.value}</div>
              <div style={{ fontSize: '11.5px', color: 'rgba(230,237,243,0.4)', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ maxWidth: '1120px', margin: '0 auto', padding: '72px 40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: '#E6EDF3', letterSpacing: '-0.02em' }}>
          Everything to <span style={{ color: '#F5A623' }}>secure your stack</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(230,237,243,0.45)', fontSize: '14.5px', marginBottom: '48px' }}>
          Free header analysis + Pro API security — one platform, complete coverage.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {ALL_FEATURES.map(({ icon: Icon, color, bg, title, desc, tier }) => (
            <div
              key={title}
              style={{ background: 'rgba(230,237,243,0.025)', border: '1px solid rgba(230,237,243,0.08)', borderRadius: '14px', padding: '22px', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,166,35,0.25)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(230,237,243,0.08)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
                <span style={{
                  fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: '5px',
                  background: tier === 'Free' ? 'rgba(96,165,250,0.1)' : 'rgba(245,166,35,0.1)',
                  color: tier === 'Free' ? '#60A5FA' : '#F5A623',
                  border: `1px solid ${tier === 'Free' ? 'rgba(96,165,250,0.25)' : 'rgba(245,166,35,0.25)'}`,
                }}>{tier}</span>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '8px', color: '#E6EDF3' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(230,237,243,0.45)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 40px 80px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: '#E6EDF3', letterSpacing: '-0.02em' }}>
          Simple <span style={{ color: '#F5A623' }}>Pricing</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(230,237,243,0.45)', fontSize: '14.5px', marginBottom: '48px' }}>
          Start free. Upgrade when you need more power.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
          {/* Free */}
          <div style={{ background: 'rgba(230,237,243,0.025)', border: '1px solid rgba(230,237,243,0.1)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Header Scanner v1</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
              <span style={{ fontSize: '40px', fontWeight: 900, color: '#E6EDF3', lineHeight: 1 }}>$0</span>
              <span style={{ fontSize: '14px', color: 'rgba(230,237,243,0.4)' }}>/mo</span>
            </div>
            <div style={{ width: '32px', height: '2px', background: '#60A5FA', margin: '16px 0' }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FREE_FEATURES.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(230,237,243,0.6)' }}>
                  <Check size={13} color="#60A5FA" strokeWidth={2.5} style={{ flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            <a href={FREE_PORT} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.4)', boxSizing: 'border-box' as const }}>
              Get Started Free
            </a>
          </div>

          {/* Pro */}
          <div style={{ background: '#161B22', border: '2px solid rgba(245,166,35,0.4)', borderRadius: '16px', padding: '28px', position: 'relative', boxShadow: '0 0 40px rgba(245,166,35,0.07)', transform: 'scale(1.02)' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#F5A623', color: '#1A1109', fontWeight: 800, fontSize: '10.5px', padding: '4px 14px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
              <Star size={10} style={{ display: 'inline', marginRight: '4px' }} strokeWidth={2.5} /> Most Popular
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>API Scanner Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
              <span style={{ fontSize: '40px', fontWeight: 900, color: '#E6EDF3', lineHeight: 1 }}>$29</span>
              <span style={{ fontSize: '14px', color: 'rgba(230,237,243,0.4)' }}>/mo</span>
            </div>
            <div style={{ width: '32px', height: '2px', background: '#F5A623', margin: '16px 0' }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Everything in Free', ...PRO_FEATURES].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(230,237,243,0.6)' }}>
                  <Check size={13} color="#F5A623" strokeWidth={2.5} style={{ flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            <Link to="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none', background: '#F5A623', color: '#1A1109', boxSizing: 'border-box' as const }}>
              Start Pro Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div style={{ background: 'rgba(230,237,243,0.025)', border: '1px solid rgba(230,237,243,0.1)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Enterprise</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
              <span style={{ fontSize: '40px', fontWeight: 900, color: '#E6EDF3', lineHeight: 1 }}>Custom</span>
            </div>
            <div style={{ width: '32px', height: '2px', background: '#a78bfa', margin: '16px 0' }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Everything in Pro', 'Unlimited team seats', 'SSO + SAML', 'Custom rules engine', 'SLA + Dedicated support', 'On-premise deployment'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(230,237,243,0.6)' }}>
                  <Check size={13} color="#a78bfa" strokeWidth={2.5} style={{ flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            <Link to="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)', boxSizing: 'border-box' as const }}>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 40px 80px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: '#E6EDF3', letterSpacing: '-0.02em' }}>
          Frequently Asked <span style={{ color: '#F5A623' }}>Questions</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(230,237,243,0.45)', fontSize: '14px', marginBottom: '40px' }}>Everything you need to know about GozoBee.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: 'rgba(230,237,243,0.025)', border: '1px solid rgba(230,237,243,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', color: '#E6EDF3', fontSize: '14px', fontWeight: 600, textAlign: 'left' }}
              >
                {faq.q}
                {openFaq === i
                  ? <ChevronUp size={16} style={{ flexShrink: 0, color: '#F5A623' }} />
                  : <ChevronDown size={16} style={{ flexShrink: 0, color: 'rgba(230,237,243,0.3)' }} />}
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 18px 16px', fontSize: '13.5px', color: 'rgba(230,237,243,0.55)', lineHeight: 1.7 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ background: '#161B22', border: '1px solid rgba(48,54,61,0.9)', borderRadius: '20px', padding: '56px 48px', textAlign: 'center' }}>
          <img src="/logo-white.svg" alt="GozoBee" style={{ height: '40px', margin: '0 auto 20px', display: 'block' }}/>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#E6EDF3', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Start securing your APIs today
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(230,237,243,0.5)', marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px' }}>
            Free header scanner — no account needed. Pro API scanner — 30-day trial, cancel anytime.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={FREE_PORT} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '13px 24px', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.4)', color: '#60A5FA', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
              <Globe size={15} /> Try Header Scanner Free
            </a>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '13px 24px', borderRadius: '12px', background: '#F5A623', color: '#1A1109', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
              <Shield size={15} /> Start API Scanner Pro <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(230,237,243,0.07)', padding: '28px 40px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo-white.svg" alt="GozoBee" style={{ height: '22px' }}/>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <a href={FREE_PORT} style={{ fontSize: '12.5px', color: 'rgba(230,237,243,0.35)', textDecoration: 'none' }}>Header Scanner</a>
            <Link to="/login" style={{ fontSize: '12.5px', color: 'rgba(230,237,243,0.35)', textDecoration: 'none' }}>API Scanner</Link>
            {['Privacy', 'Terms', 'Docs'].map((l) => (
              <Link key={l} to="/" style={{ fontSize: '12.5px', color: 'rgba(230,237,243,0.35)', textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
