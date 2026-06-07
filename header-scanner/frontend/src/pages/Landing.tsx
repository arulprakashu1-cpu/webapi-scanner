import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, CheckCircle, AlertTriangle, Loader2, ExternalLink,
  Globe, Zap, ArrowRight, ChevronDown,
} from 'lucide-react'
import { CaptchaField } from '../components/CaptchaField'
import { ScanProgressBar } from '../components/ScanProgressBar'
import { PRO_URL, API_BASE as API } from '../config'
import { scansApi, PublicScanResult } from '../api/scans'

const GRADE_COLOR: Record<string, string> = {
  'A+': '#3FB950', A: '#3FB950', B: '#D29922', C: '#F0883E', D: '#F85149', F: '#F85149',
}
const GRADE_GLOW: Record<string, string> = {
  'A+': 'rgba(63,185,80,0.3)', A: 'rgba(63,185,80,0.3)', B: 'rgba(210,153,34,0.3)',
  C: 'rgba(240,136,62,0.3)', D: 'rgba(248,81,73,0.3)', F: 'rgba(248,81,73,0.3)',
}
const SEV: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: '#F85149', bg: 'rgba(248,81,73,0.1)',   border: 'rgba(248,81,73,0.2)',   label: 'Critical' },
  high:     { color: '#F0883E', bg: 'rgba(240,136,62,0.1)',  border: 'rgba(240,136,62,0.2)',  label: 'High' },
  medium:   { color: '#D29922', bg: 'rgba(210,153,34,0.1)',  border: 'rgba(210,153,34,0.2)',  label: 'Medium' },
  low:      { color: '#A371F7', bg: 'rgba(163,113,247,0.1)', border: 'rgba(163,113,247,0.2)', label: 'Low' },
  info:     { color: '#8B949E', bg: 'rgba(139,148,158,0.1)', border: 'rgba(139,148,158,0.2)', label: 'Info' },
}
const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

function statusCfg(s: string) {
  switch (s) {
    case 'present':     return { label: 'Secure',  color: '#3FB950', icon: '✓' }
    case 'not_present': return { label: 'Clean',   color: '#3FB950', icon: '✓' }
    case 'missing':     return { label: 'Missing', color: '#F85149', icon: '✗' }
    case 'info_leak':   return { label: 'Leaking', color: '#D29922', icon: '⚠' }
    case 'absent':      return { label: 'Absent',  color: '#8B949E', icon: '○' }
    default:            return { label: s,          color: '#8B949E', icon: '○' }
  }
}
function parseLinks(raw: string | null): string[] {
  try { return JSON.parse(raw || '[]') } catch { return [] }
}

const HEADERS_INFO = [
  { name: 'Content-Security-Policy',      abbr: 'CSP',  risk: 'critical', desc: 'Blocks XSS & code injection attacks' },
  { name: 'Strict-Transport-Security',    abbr: 'HSTS', risk: 'high',     desc: 'Enforces HTTPS-only connections' },
  { name: 'X-Frame-Options',              abbr: 'XFO',  risk: 'high',     desc: 'Prevents clickjacking attacks' },
  { name: 'X-Content-Type-Options',       abbr: 'XCTO', risk: 'medium',   desc: 'Stops MIME-type sniffing' },
  { name: 'Referrer-Policy',              abbr: 'RP',   risk: 'medium',   desc: 'Controls referrer information leaks' },
  { name: 'Permissions-Policy',           abbr: 'PP',   risk: 'medium',   desc: 'Restricts browser feature access' },
  { name: 'Cross-Origin-Embedder-Policy', abbr: 'COEP', risk: 'medium',   desc: 'Isolates cross-origin resources' },
  { name: 'Cross-Origin-Opener-Policy',   abbr: 'COOP', risk: 'medium',   desc: 'Isolates browsing context groups' },
  { name: 'Cross-Origin-Resource-Policy', abbr: 'CORP', risk: 'medium',   desc: 'Restricts resource sharing' },
  { name: 'Cache-Control',                abbr: 'CC',   risk: 'low',      desc: 'Prevents sensitive data caching' },
  { name: 'X-DNS-Prefetch-Control',       abbr: 'DNS',  risk: 'low',      desc: 'Controls DNS prefetching behavior' },
  { name: 'Expect-CT',                    abbr: 'ECT',  risk: 'info',     desc: 'Certificate transparency enforcement' },
  { name: 'Server',                       abbr: 'SRV',  risk: 'high',     desc: 'Detects server version disclosure' },
  { name: 'X-Powered-By',                 abbr: 'XPB',  risk: 'high',     desc: 'Detects tech stack exposure' },
]

const R = 50, CL = 2 * Math.PI * R
function GradeRing({ grade, secured, total }: { grade: string; secured: number; total: number }) {
  const color = GRADE_COLOR[grade] || '#8B949E'
  const glow  = GRADE_GLOW[grade]  || 'transparent'
  const dash  = (secured / total) * CL
  return (
    <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#21262D" strokeWidth="10"/>
        <circle cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${CL}`} strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '34px', fontWeight: 900, color, lineHeight: 1 }}>{grade}</span>
        <span style={{ fontSize: '10px', color: '#8B949E', marginTop: '3px', fontWeight: 600 }}>{secured}/{total} ok</span>
      </div>
    </div>
  )
}

type Finding = PublicScanResult['findings'][0]
type Tab = 'headers' | 'remediation'

function FindingRow({ f, selected, onClick }: { f: Finding; selected: boolean; onClick: () => void }) {
  const sc  = statusCfg(f.status)
  const sev = SEV[f.severity.toLowerCase()] || SEV.info
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', width: '100%', border: 'none', background: selected ? 'rgba(245,166,35,0.04)' : 'transparent', cursor: 'pointer', textAlign: 'left', borderLeft: selected ? '3px solid #F5A623' : '3px solid transparent', transition: 'background 0.1s' }}>
      <span style={{ fontSize: '13px', color: sc.color, width: 16, flexShrink: 0, lineHeight: 1 }}>{sc.icon}</span>
      <span style={{ flex: 1, fontFamily: '"DM Mono", monospace', fontSize: '12px', color: '#C0CADE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.header_name}</span>
      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, flexShrink: 0 }}>{sev.label.toUpperCase()}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: sc.color, width: 54, textAlign: 'right', flexShrink: 0 }}>{sc.label}</span>
    </button>
  )
}

function FindingDetail({ f, onClose }: { f: Finding; onClose: () => void }) {
  const sc  = statusCfg(f.status)
  const sev = SEV[f.severity.toLowerCase()] || SEV.info
  const links = parseLinks(f.reference_links)
  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid #21262D', borderLeft: `3px solid ${sc.color}`, background: '#0D1117' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#E6EDF3' }}>{f.header_name}</span>
          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color }}>{f.severity.toUpperCase()}</span>
        </div>
        <button onClick={onClose} style={{ fontSize: '11px', color: '#8B949E', background: '#21262D', border: '1px solid #30363D', borderRadius: '5px', padding: '3px 9px', cursor: 'pointer' }}>✕</button>
      </div>
      {f.description && <p style={{ fontSize: '13px', color: '#8D96A0', lineHeight: 1.65, marginBottom: '8px' }}>{f.description}</p>}
      {f.payload && <code style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#F5A623', background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: '6px', padding: '8px 12px', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: '8px' }}>{f.payload}</code>}
      {f.remediation && <p style={{ fontSize: '13px', color: '#8D96A0', lineHeight: 1.65, marginBottom: '8px' }}><strong style={{ color: '#E6EDF3' }}>Fix: </strong>{f.remediation}</p>}
      {links.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {links.map((href, i) => (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#58A6FF', textDecoration: 'none', background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)', borderRadius: '5px', padding: '3px 8px' }}>
              <ExternalLink size={9}/>{href.includes('mdn') ? 'MDN' : href.includes('owasp') ? 'OWASP' : 'Ref'}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function Landing() {
  const [url, setUrl]                   = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [scanning, setScanning]         = useState(false)
  const [result, setResult]             = useState<PublicScanResult | null>(null)
  const [error, setError]               = useState('')
  const [activeTab, setActiveTab]       = useState<Tab>('headers')
  const [selectedRow, setSelectedRow]   = useState<string | null>(null)
  const [clearing, setClearing]         = useState(false)
  const [cleared, setCleared]           = useState(false)

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return setError('Please enter a URL')
    if (!captchaToken) return setError('Please complete the CAPTCHA')
    setError(''); setScanning(true); setResult(null); setActiveTab('headers'); setSelectedRow(null)
    try {
      const scanUrl = url.startsWith('http') ? url : `https://${url}`
      const r = (await scansApi.publicScan({ url: scanUrl, captcha_token: captchaToken })).data
      setResult(r)
      setTimeout(() => document.getElementById('scan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err: any) {
      if (err.response?.status === 429) setError("You've used your free scan for today. Sign up for unlimited access.")
      else setError(err.response?.data?.detail || 'Scan failed. Please try again.')
    } finally { setScanning(false) }
  }

  const clearIpLog = async () => {
    setClearing(true)
    try { await fetch(`${API}/api/dev/clear-ip-log`, { method: 'DELETE' }); setCleared(true); setTimeout(() => setCleared(false), 3000) }
    catch { } finally { setClearing(false) }
  }

  const securedCount  = result?.findings.filter(f => f.status === 'present' || f.status === 'not_present').length ?? 0
  const issueFindings = result
    ? [...result.findings].filter(f => f.status === 'missing' || f.status === 'info_leak')
        .sort((a, b) => (SEV_ORDER[a.severity.toLowerCase()] ?? 5) - (SEV_ORDER[b.severity.toLowerCase()] ?? 5))
    : []
  const selectedFinding = result?.findings.find(f => f.header_name === selectedRow) ?? null

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { transform:translateY(8px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .scan-btn:hover:not(:disabled) { background:#E8941A!important; }
        .nav-lnk:hover { color:#E6EDF3!important; }
        .url-wrap:focus-within { border-color:rgba(245,166,35,0.4)!important; }
        .tab-btn:hover { color:#C0CADE!important; }
        .hdr-row:hover  { background:rgba(255,255,255,0.02)!important; }
        .hdr-item:hover { background:rgba(255,255,255,0.02)!important; }
      `}</style>

      {/* ── NAVBAR ── minimal */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0, backdropFilter: 'blur(12px)', background: 'rgba(13,17,23,0.9)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo-white.svg" alt="GozoBee" style={{ height: '22px', opacity: 0.9 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Link to="/login" className="nav-lnk" style={{ fontSize: '13px', color: '#8B949E', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', transition: 'color 0.15s' }}>Sign in</Link>
            <Link to="/register" style={{ fontSize: '13px', fontWeight: 600, padding: '6px 16px', borderRadius: '6px', textDecoration: 'none', background: '#F5A623', color: '#0D1117' }}>Register</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── VirusTotal-style: logo → title → search */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 18px 28px' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          {/* Heading */}
          <h1 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 600, color: '#E6EDF3', marginBottom: '8px', letterSpacing: '-0.01em' }}>
            Security Header Scanner
          </h1>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#8B949E', marginBottom: '28px', lineHeight: 1.6 }}>
            Analyze any website's HTTP security headers against OWASP standards.
          </p>

          {/* ── SCAN FORM ── */}
          <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* URL bar */}
            <div className="url-wrap" style={{ display: 'flex', alignItems: 'center', background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 4px 4px 14px', gap: '10px', transition: 'border-color 0.15s' }}>
              <Globe size={15} color="#484F58" style={{ flexShrink: 0 }}/>
              <input
                type="text" value={url} onChange={e => setUrl(e.target.value)} disabled={scanning}
                placeholder="https://yourwebsite.com"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '14px', color: '#E6EDF3', padding: '9px 0', minWidth: 0 }}
              />
              <button type="submit" disabled={scanning || !captchaToken} className="scan-btn"
                style={{ background: scanning || !captchaToken ? '#21262D' : '#F5A623', color: scanning || !captchaToken ? '#484F58' : '#0D1117', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: scanning || !captchaToken ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.15s' }}>
                {scanning
                  ? <><Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }}/>Scanning…</>
                  : <><Search size={13}/>Scan Now</>}
              </button>
            </div>

            <CaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')}/>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.18)', borderRadius: '7px', padding: '9px 12px', color: '#F85149', fontSize: '12px' }}>
                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '1px' }}/><span>{error}</span>
              </div>
            )}

            <ScanProgressBar active={scanning}/>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 1px 0' }}>
              <span style={{ fontSize: '11px', color: '#6E7681' }}>
                1 free scan/IP/day · <Link to="/register" style={{ color: '#F5A623', textDecoration: 'none' }}>Sign up</Link> for unlimited
              </span>
              <button type="button" onClick={clearIpLog} disabled={clearing}
                style={{ fontSize: '11px', color: cleared ? '#3FB950' : '#484F58', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {cleared ? '✓ Reset' : '⚙ Reset limit'}
              </button>
            </div>
          </form>

          {/* Scroll to results */}
          {result && !scanning && (
            <div style={{ textAlign: 'center', marginTop: '16px', animation: 'fadeUp 0.3s ease-out' }}>
              <button onClick={() => document.getElementById('scan-results')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                View results <ChevronDown size={13}/>
              </button>
            </div>
          )}

          {/* Stat pills */}
          {!result && !scanning && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '28px', flexWrap: 'wrap' }}>
              {[
                { label: '14 headers',   color: '#F5A623', bg: 'rgba(245,166,35,0.08)',  border: 'rgba(245,166,35,0.18)' },
                { label: 'OWASP',        color: '#58A6FF', bg: 'rgba(88,166,255,0.08)',  border: 'rgba(88,166,255,0.18)' },
                { label: 'A+ to F grade',color: '#3FB950', bg: 'rgba(63,185,80,0.08)',   border: 'rgba(63,185,80,0.18)' },
                { label: 'Always free',  color: '#A371F7', bg: 'rgba(163,113,247,0.08)', border: 'rgba(163,113,247,0.18)' },
              ].map(p => (
                <span key={p.label} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '99px', background: p.bg, border: `1px solid ${p.border}`, color: p.color, fontWeight: 500 }}>{p.label}</span>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ── SCAN RESULTS ── */}
      {result && (
        <section id="scan-results" style={{ padding: '0 24px 80px', animation: 'fadeUp 0.35s ease-out' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>

            {!result.reachable ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', background: '#161B22', border: '1px solid rgba(248,81,73,0.2)', borderRadius: '14px' }}>
                <AlertTriangle size={36} color="#F85149" style={{ margin: '0 auto 12px' }}/>
                <p style={{ fontWeight: 700, color: '#F85149', fontSize: '15px', marginBottom: '6px' }}>Could not reach the URL</p>
                <p style={{ fontSize: '13px', color: '#8B949E' }}>{result.error || 'Check the URL and try again.'}</p>
              </div>
            ) : (
              <>
                {/* Summary card */}
                <div style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '14px', padding: '24px 28px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                  <GradeRing grade={result.grade} secured={securedCount} total={14}/>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11.5px', color: '#484F58', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: '12px', padding: '6px 10px', background: '#21262D', borderRadius: '6px', display: 'inline-block', maxWidth: '100%' }}>{result.url}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      {issueFindings.length === 0
                        ? <><CheckCircle size={14} color="#3FB950"/><span style={{ fontSize: '13.5px', fontWeight: 700, color: '#3FB950' }}>All headers configured correctly</span></>
                        : <><AlertTriangle size={14} color="#D29922"/><span style={{ fontSize: '13.5px', fontWeight: 700, color: '#D29922' }}>{issueFindings.length} issue{issueFindings.length > 1 ? 's' : ''} found — action required</span></>
                      }
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {(['critical','high','medium','low','info'] as const).map(sev => {
                        const cnt = (result.counts as Record<string,number>)[sev] ?? 0
                        if (!cnt) return null
                        return <span key={sev} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: SEV[sev].bg, border: `1px solid ${SEV[sev].border}`, color: SEV[sev].color }}>{cnt} {sev}</span>
                      })}
                      {issueFindings.length === 0 && <span style={{ fontSize: '11px', color: '#3FB950', fontWeight: 700 }}>✓ Perfect score</span>}
                    </div>
                  </div>
                  <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '9px 18px', borderRadius: '6px', textDecoration: 'none', background: '#F5A623', color: '#0D1117', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <ArrowRight size={13}/> Save Report
                  </Link>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', background: '#161B22', border: '1px solid #30363D', borderBottom: 'none', borderTop: '1px solid #21262D', marginTop: '12px', borderRadius: '10px 10px 0 0' }}>
                  {([
                    { id: 'headers'     as Tab, label: 'Header Analysis', count: result.findings.length },
                    { id: 'remediation' as Tab, label: 'Fix Guide',       count: issueFindings.length },
                  ] as const).map(t => (
                    <button key={t.id} className="tab-btn" onClick={() => { setActiveTab(t.id); setSelectedRow(null) }}
                      style={{ padding: '11px 20px', fontSize: '13px', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: activeTab === t.id ? '2px solid #58A6FF' : '2px solid transparent', color: activeTab === t.id ? '#58A6FF' : '#8B949E', display: 'flex', alignItems: 'center', gap: '7px', transition: 'color 0.15s', marginBottom: '-1px' }}>
                      {t.label}
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '7px', background: activeTab === t.id ? 'rgba(88,166,255,0.15)' : '#21262D', color: activeTab === t.id ? '#58A6FF' : '#8B949E', fontWeight: 700 }}>{t.count}</span>
                    </button>
                  ))}
                </div>

                {/* Header analysis */}
                {activeTab === 'headers' && (
                  <div style={{ border: '1px solid #30363D', borderTop: 'none', borderRadius: '0 0 12px 12px', background: '#161B22', overflow: 'hidden' }}>
                    {result.findings.map((f, i) => (
                      <div key={f.header_name} className="hdr-row">
                        <div style={{ borderBottom: selectedRow === f.header_name ? 'none' : (i < result.findings.length - 1 ? '1px solid #21262D' : 'none') }}>
                          <FindingRow f={f} selected={selectedRow === f.header_name} onClick={() => setSelectedRow(selectedRow === f.header_name ? null : f.header_name)}/>
                        </div>
                        {selectedRow === f.header_name && selectedFinding && (
                          <FindingDetail f={selectedFinding} onClose={() => setSelectedRow(null)}/>
                        )}
                        {selectedRow === f.header_name && i < result.findings.length - 1 && <div style={{ borderBottom: '1px solid #21262D' }}/>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fix guide */}
                {activeTab === 'remediation' && (
                  <div style={{ border: '1px solid #30363D', borderTop: 'none', borderRadius: '0 0 12px 12px', background: '#161B22', overflow: 'hidden' }}>
                    {issueFindings.length === 0 ? (
                      <div style={{ padding: '60px', textAlign: 'center' }}>
                        <CheckCircle size={32} color="#3FB950" style={{ margin: '0 auto 12px' }}/>
                        <p style={{ fontWeight: 700, color: '#3FB950', fontSize: '15px' }}>All headers properly configured</p>
                        <p style={{ fontSize: '12.5px', color: '#8B949E', marginTop: '6px' }}>Your site meets all 14 OWASP security header requirements.</p>
                      </div>
                    ) : issueFindings.map((f, idx) => {
                      const sc = statusCfg(f.status)
                      const sev = SEV[f.severity.toLowerCase()] || SEV.info
                      const links = parseLinks(f.reference_links)
                      return (
                        <div key={f.header_name} style={{ borderBottom: idx < issueFindings.length - 1 ? '1px solid #21262D' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', background: '#1A1F26', borderBottom: '1px solid #21262D' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#8B949E', background: '#21262D', minWidth: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', color: '#E6EDF3', fontWeight: 600, flex: 1 }}>{f.header_name}</span>
                            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, flexShrink: 0 }}>{f.severity.toUpperCase()}</span>
                            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${sc.color}14`, border: `1px solid ${sc.color}33`, color: sc.color, flexShrink: 0 }}>{sc.label.toUpperCase()}</span>
                          </div>
                          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {f.description && <p style={{ fontSize: '12.5px', color: '#8D96A0', lineHeight: 1.65 }}>{f.description}</p>}
                            {f.payload && <code style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#F5A623', background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: '5px', padding: '7px 12px', wordBreak: 'break-all', lineHeight: 1.6 }}>{f.payload}</code>}
                            {f.remediation && <p style={{ fontSize: '12.5px', color: '#8D96A0', lineHeight: 1.65 }}><strong style={{ color: '#E6EDF3' }}>Fix: </strong>{f.remediation}</p>}
                            {links.length > 0 && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {links.map((href, i) => (
                                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#58A6FF', textDecoration: 'none', background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)', borderRadius: '5px', padding: '3px 8px' }}>
                                    <ExternalLink size={9}/>{href.includes('mdn') ? 'MDN' : href.includes('owasp') ? 'OWASP' : 'Ref'}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── BELOW FOLD ── */}
      {!result && (
        <>
          {/* How it works */}
          <section style={{ padding: '56px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 600, color: '#E6EDF3', marginBottom: '6px' }}>How it works</h2>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#6E7681', marginBottom: '32px' }}>Three steps. No signup required.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                {[
                  { n: '1', title: 'Enter any URL',    desc: 'Paste your website URL. No login required.' },
                  { n: '2', title: 'Instant analysis', desc: 'Checks 14 HTTP headers against OWASP in seconds.' },
                  { n: '3', title: 'Grade + Fix guide', desc: 'A+ to F grade with prioritized remediation steps.' },
                ].map(step => (
                  <div key={step.n} style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#484F58', marginBottom: '10px' }}>Step {step.n}</div>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3', marginBottom: '6px' }}>{step.title}</h3>
                    <p style={{ fontSize: '12px', color: '#6E7681', lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 14 headers table */}
          <section style={{ padding: '0 24px 56px' }}>
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 600, color: '#E6EDF3', marginBottom: '6px' }}>14 headers we analyze</h2>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#6E7681', marginBottom: '24px' }}>Full OWASP HTTP Security Headers coverage, ranked by risk.</p>
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr 72px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '9px 16px', gap: '12px' }}>
                  {['Abbr', 'Header Name', 'Protects against', 'Risk'].map(h => (
                    <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#484F58', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                  ))}
                </div>
                {HEADERS_INFO.map((h, i) => {
                  const sev = SEV[h.risk] || SEV.info
                  return (
                    <div key={h.abbr} className="hdr-item" style={{ display: 'grid', gridTemplateColumns: '56px 1fr 1fr 72px', padding: '10px 16px', gap: '12px', alignItems: 'center', borderBottom: i < HEADERS_INFO.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.1s' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#F5A623', fontWeight: 600 }}>{h.abbr}</span>
                      <span style={{ fontSize: '12px', color: '#C0CADE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                      <span style={{ fontSize: '12px', color: '#6E7681' }}>{h.desc}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, display: 'inline-block' }}>{sev.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section style={{ padding: '0 24px 64px' }}>
            <div style={{ maxWidth: '820px', margin: '0 auto', background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '36px 32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#E6EDF3', marginBottom: '8px' }}>Save and track your results</h2>
              <p style={{ fontSize: '13px', color: '#6E7681', lineHeight: 1.6, marginBottom: '20px' }}>
                Create a free account to save scans, track improvements, and scan unlimited domains.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '9px 20px', borderRadius: '6px', textDecoration: 'none', background: '#F5A623', color: '#0D1117' }}>
                  <ArrowRight size={13}/> Create Free Account
                </Link>
                <a href={`${PRO_URL}/register`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '9px 20px', borderRadius: '6px', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: '#8B949E', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Zap size={13} color="#A371F7"/> Pro API Scanner
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#484F58' }}>© 2026 GozoBee · Security header scanner</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/login"    style={{ fontSize: '12px', color: '#484F58', textDecoration: 'none' }}>Sign in</Link>
            <Link to="/register" style={{ fontSize: '12px', color: '#484F58', textDecoration: 'none' }}>Register</Link>
            <a href={PRO_URL} style={{ fontSize: '12px', color: '#484F58', textDecoration: 'none' }}>Pro API</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
