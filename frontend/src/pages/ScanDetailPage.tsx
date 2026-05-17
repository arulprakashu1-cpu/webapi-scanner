import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import FindingItem from '../components/FindingItem'
import { ScanFinding, Severity, AiAnalysis } from '../types'
import {
  ArrowLeft, CheckCircle2, XCircle, FileJson, FileText,
  Shield, AlertTriangle, Zap, ChevronDown, ChevronUp,
  Loader2, Brain, Check, X, Minus, Lock, Globe, Server, ShieldAlert,
} from 'lucide-react'
import { formatTime, duration } from '../utils/date'

const SEV_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const SEV_CSS: Record<Severity, { sev: string; bar: string }> = {
  critical: { sev: 'sev-c', bar: '#D92B2B' },
  high:     { sev: 'sev-h', bar: '#E8720C' },
  medium:   { sev: 'sev-m', bar: '#B87D00' },
  low:      { sev: 'sev-l', bar: '#1F8A5E' },
  info:     { sev: 'sev-i', bar: '#2058C7' },
}
const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: 'var(--sev-critical)', bg: 'var(--bg-critical)', border: 'rgba(217,43,43,.2)', label: 'CRITICAL RISK' },
  high:     { color: 'var(--sev-high)',     bg: 'var(--bg-high)',     border: 'rgba(232,114,12,.2)',label: 'HIGH RISK' },
  medium:   { color: 'var(--sev-medium)',   bg: 'var(--bg-medium)',   border: 'rgba(184,125,0,.2)', label: 'MEDIUM RISK' },
  low:      { color: 'var(--sev-low)',      bg: 'var(--bg-low)',      border: 'rgba(31,138,94,.2)', label: 'LOW RISK' },
}

const OWASP_CATS = [
  'API1: Broken Object Level Authorization',
  'API2: Broken Authentication',
  'API3: Broken Object Property Level Authorization',
  'API4: Unrestricted Resource Consumption',
  'API5: Broken Function Level Authorization',
  'API6: Sensitive Business Flows',
  'API7: Server Side Request Forgery',
  'API8: Security Misconfiguration',
  'API9: Improper Inventory Management',
  'API10: Unsafe Consumption of APIs',
]

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Severity | 'all'>('all')
  const [exporting, setExporting] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const isActive = (s?: string) => s === 'running' || s === 'queued'

  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', id],
    queryFn: () => scansApi.get(id!),
    refetchInterval: (q) => (isActive(q.state.data?.status) ? 2000 : false),
    enabled: !!id,
  })

  const { data: findings = [] } = useQuery<ScanFinding[]>({
    queryKey: ['findings', id],
    queryFn: () => scansApi.findings(id!),
    enabled: !!id && scan?.status === 'completed',
    refetchOnWindowFocus: false,
  })

  const { data: aiData, isLoading: aiLoading } = useQuery<AiAnalysis>({
    queryKey: ['ai-analysis', id],
    queryFn: () => scansApi.analyze(id!),
    enabled: !!id && scan?.status === 'completed' && aiOpen,
    staleTime: Infinity,
    retry: false,
  })

  const handleExportJson = async () => { if (!id) return; setExporting(true); try { await scansApi.exportJson(id) } finally { setExporting(false) } }
  const handleExportCsv  = async () => { if (!id) return; setExporting(true); try { await scansApi.exportCsv(id)  } finally { setExporting(false) } }
  const handleExportPdf  = async () => { if (!id) return; setExporting(true); try { await scansApi.exportPdf(id)  } finally { setExporting(false) } }

  const filtered: ScanFinding[] = filter === 'all' ? findings : findings.filter((f) => f.severity === filter)
  const summary = scan?.severity_summary || { critical: 0, high: 0, medium: 0, low: 0, info: 0 }

  const score = scan?.security_score != null
    ? scan.security_score
    : findings.length === 0 ? 100
    : Math.max(0, 100 - (summary.critical || 0) * 22 - (summary.high || 0) * 10 - (summary.medium || 0) * 5 - (summary.low || 0) * 2)

  const scoreGrade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F'
  const scoreColor = score >= 70 ? 'var(--sev-low)' : score >= 40 ? 'var(--sev-medium)' : 'var(--sev-critical)'

  // SVG ring: r=52, circumference ≈ 327
  const CIRC = 2 * Math.PI * 52
  const dashOffset = CIRC * (1 - score / 100)

  // OWASP breakdown — count findings per category
  const owaspCounts = OWASP_CATS.map((cat) => ({
    label: cat.split(': ')[0],
    name: cat.split(': ')[1],
    count: findings.filter((f) => f.owasp_category?.includes(cat.split(':')[0])).length,
  }))
  const maxOwasp = Math.max(1, ...owaspCounts.map((o) => o.count))

  // Security checklist
  const checklist = [
    { label: 'HTTPS Enforced',    status: scan?.https_enforced ? 'ok' : scan?.status === 'completed' ? 'fail' : 'warn', icon: Lock },
    { label: 'Security Headers',  status: scan?.headers_pass === true ? 'ok' : scan?.headers_pass === false ? 'fail' : 'warn', icon: Shield },
    { label: 'CORS Policy',       status: scan?.cors_safe === true ? 'ok' : scan?.cors_safe === false ? 'fail' : 'warn', icon: Globe },
    { label: 'Authentication',    status: scan?.auth_type !== 'none' ? 'ok' : 'warn', icon: Lock },
    { label: 'No Critical Issues',status: (summary.critical || 0) === 0 && scan?.status === 'completed' ? 'ok' : (summary.critical || 0) > 0 ? 'fail' : 'warn', icon: ShieldAlert },
    { label: 'Rate Limiting',     status: findings.some((f) => f.owasp_category?.includes('API4')) ? 'fail' : scan?.status === 'completed' ? 'ok' : 'warn', icon: Server },
  ]

  if (isLoading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'gbl-spin 0.6s linear infinite' }} />
      </div>
    </Layout>
  )

  if (!scan) return (
    <Layout>
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-body)', fontSize: '13px' }}>
        Scan not found. <Link to="/dashboard" style={{ color: 'var(--brand)' }}>Back to dashboard</Link>
      </div>
    </Layout>
  )

  return (
    <Layout>
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-body)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
      >
        <ArrowLeft size={14} /> Back to dashboard
      </button>

      {/* Running progress bar */}
      {isActive(scan.status) && (
        <div className="prog-bar" style={{ marginBottom: '16px' }}>
          <div className="prog-ico">
            <Loader2 size={15} style={{ animation: 'gbl-spin 1.8s linear infinite' }} />
          </div>
          <div className="prog-content">
            <div className="prog-label">Scanning {scan.target_url}…</div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${scan.progress}%` }} />
            </div>
          </div>
          <div className="prog-pct">{scan.progress}%</div>
        </div>
      )}

      {/* Alert strip for critical findings */}
      {scan.status === 'completed' && (summary.critical || 0) > 0 && (
        <div className="alert-strip" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={15} />
          <div className="alert-text">
            <strong>{summary.critical} critical</strong> {summary.critical === 1 ? 'vulnerability' : 'vulnerabilities'} found — immediate remediation required.
          </div>
        </div>
      )}

      {/* Scan header */}
      <div className="panel" style={{ marginBottom: '14px' }}>
        <div className="p-head">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-head)' }}>
                {scan.target_url ? new URL(scan.target_url).hostname : scan.name}
              </h1>
              <StatusBadge status={scan.status} />
            </div>
            {scan.target_url && (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'DM Mono, monospace' }}>{scan.target_url}</div>
            )}
          </div>
          {scan.status === 'completed' && (
            <div className="p-actions">
              <button onClick={handleExportJson} disabled={exporting} className="p-btn"><FileJson size={12} /> JSON</button>
              <button onClick={handleExportCsv} disabled={exporting} className="p-btn"><FileText size={12} /> CSV</button>
              <button onClick={handleExportPdf} disabled={exporting} className="p-btn"><FileText size={12} /> PDF</button>
            </div>
          )}
        </div>

        {/* Metadata chips */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: scan.status === 'failed' ? '1px solid var(--border)' : 'none' }}>
          {[
            { label: 'Started',    value: scan.started_at ? formatTime(scan.started_at) : '—' },
            { label: 'Duration',   value: duration(scan.started_at, scan.finished_at) },
            { label: 'Auth',       value: scan.auth_type === 'none' ? 'None' : scan.auth_type === 'bearer' ? 'Bearer Token' : 'API Key' },
            { label: 'Type',       value: scan.target_type === 'manual' ? 'URL Scan' : 'OpenAPI Spec' },
            { label: 'Endpoints',  value: scan.endpoints_count != null ? String(scan.endpoints_count) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px' }}>
              <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-body)', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>

        {scan.status === 'failed' && (
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--bg-critical)' }}>
            <XCircle size={16} style={{ color: 'var(--sev-critical)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--sev-critical)', fontSize: '13px', marginBottom: '3px' }}>Scan failed</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-body)' }}>{scan.error_message || 'An unexpected error occurred.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT GRID */}
      {scan.status === 'completed' && (
        <div className="cgrid">
          {/* LEFT: Findings panel */}
          <div>
            {/* AI Analysis */}
            <div className="panel" style={{ marginBottom: '14px' }}>
              <button
                onClick={() => setAiOpen((v) => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', background: 'var(--brand-light)', border: '1px solid rgba(245,166,35,.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={15} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-head)' }}>AI Security Analysis</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                      {aiData ? 'Analysis complete' : 'Claude AI risk assessment + remediation roadmap'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!aiData && !aiLoading && <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--brand-light)', color: 'var(--brand-deep)', padding: '3px 9px', borderRadius: '6px' }}>Generate</span>}
                  {aiLoading && <Loader2 size={14} style={{ color: 'var(--brand)', animation: 'gbl-spin 1s linear infinite' }} />}
                  {aiOpen ? <ChevronUp size={15} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={15} style={{ color: 'var(--text-dim)' }} />}
                </div>
              </button>

              {aiOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px' }}>
                  {aiLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-body)', fontSize: '13px', padding: '12px 0' }}>
                      <div style={{ width: '18px', height: '18px', border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'gbl-spin 0.7s linear infinite', flexShrink: 0 }} />
                      Claude is analyzing {findings.length} findings…
                    </div>
                  )}
                  {aiData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ background: RISK_CONFIG[aiData.risk_level]?.bg, border: `1px solid ${RISK_CONFIG[aiData.risk_level]?.border}`, borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                          <AlertTriangle size={14} style={{ color: RISK_CONFIG[aiData.risk_level]?.color }} />
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: RISK_CONFIG[aiData.risk_level]?.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{RISK_CONFIG[aiData.risk_level]?.label}</span>
                          {aiData.cached && <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: 'auto' }}>cached</span>}
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-head)', lineHeight: 1.65 }}>{aiData.executive_summary}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ background: 'var(--bg-surface2)', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--sev-critical)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Attack Narrative</div>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: 1.6 }}>{aiData.attack_narrative}</p>
                        </div>
                        <div style={{ background: 'var(--bg-surface2)', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--sev-medium)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Top Priorities</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {aiData.top_priorities.map((p, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--brand)', color: '#000', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{i+1}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.5 }}>{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-low)', border: '1px solid rgba(31,138,94,.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--sev-low)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Zap size={12} /> Quick Wins
                        </div>
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                          {aiData.quick_wins.map((w, i) => (
                            <span key={i} style={{ fontSize: '12px', color: 'var(--sev-low)', background: 'rgba(31,138,94,.12)', border: '1px solid rgba(31,138,94,.2)', padding: '4px 10px', borderRadius: '7px' }}>✓ {w}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="stats" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: '14px' }}>
              {[
                { cls: 's-total', label: 'Total', value: findings.length },
                { cls: 's-crit',  label: 'Critical', value: summary.critical || 0 },
                { cls: 's-high',  label: 'High', value: summary.high || 0 },
                { cls: 's-med',   label: 'Medium', value: summary.medium || 0 },
                { cls: 's-low',   label: 'Low/Info', value: (summary.low || 0) + (summary.info || 0) },
              ].map(({ cls, label, value }) => (
                <div key={label} className={`stat ${cls}`}>
                  <div className="stat-lbl">{label}</div>
                  <div className="stat-val">{value}</div>
                </div>
              ))}
            </div>

            {/* Findings panel */}
            <div className="panel">
              <div className="p-head">
                <div className="p-title"><Shield size={15} />Findings</div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>{filtered.length} of {findings.length}</span>
              </div>

              {/* Filter tabs */}
              <div className="ftabs">
                <button className={`ftab${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>
                  All <span className="chip">{findings.length}</span>
                </button>
                {SEV_ORDER.filter((s) => (summary[s] || 0) > 0).map((sev) => (
                  <button key={sev} className={`ftab${filter === sev ? ' on' : ''}`} onClick={() => setFilter(filter === sev ? 'all' : sev)}>
                    <span className={SEV_CSS[sev].sev} style={{ fontSize: '9px', padding: '1px 5px' }}>{sev.charAt(0).toUpperCase() + sev.slice(1)}</span>
                    <span className="chip">{summary[sev]}</span>
                  </button>
                ))}
              </div>

              {findings.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <CheckCircle2 size={36} style={{ color: 'var(--sev-low)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-head)', marginBottom: '5px' }}>No vulnerabilities found</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-body)' }}>This API passed all security checks.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-body)', fontSize: '13px' }}>
                  No {filter} findings. <button onClick={() => setFilter('all')} style={{ color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Show all</button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface2)', borderBottom: '1px solid var(--border)' }}>
                      {['Sev', 'Finding', 'Endpoint', 'Confidence', 'OWASP', ''].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--brand-deep)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f, i) => <FindingItem key={f.id} finding={f} index={i} />)}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="rcol">
            {/* Security Score Ring */}
            <div className="score-card">
              <div className="sc-head">
                <div className="sc-title">Security Score</div>
                <span className="grade" style={{ background: score >= 70 ? 'var(--bg-low)' : score >= 40 ? 'var(--bg-medium)' : 'var(--bg-critical)', color: scoreColor }}>
                  {scoreGrade}
                </span>
              </div>
              <div className="ring-wrap">
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                  <svg className="ring-svg" viewBox="0 0 120 120" style={{ width: '120px', height: '120px' }}>
                    <circle className="ring-bg" cx="60" cy="60" r="52" />
                    <circle
                      className="ring-amber"
                      cx="60" cy="60" r="52"
                      style={{ strokeDashoffset: dashOffset, transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '28px', fontWeight: 300, color: scoreColor, lineHeight: 1 }}>{score}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>/100</span>
                  </div>
                </div>
              </div>
              <div className="sbars">
                {SEV_ORDER.slice(0, 4).map((sev) => {
                  const count = summary[sev] || 0
                  const pct = findings.length ? Math.round((count / findings.length) * 100) : 0
                  return (
                    <div key={sev} className="sbar">
                      <span className="sbar-lbl" style={{ textTransform: 'capitalize' }}>{sev}</span>
                      <div className="sbar-track">
                        <div className="sbar-fill" style={{ width: `${pct}%`, background: SEV_CSS[sev].bar }} />
                      </div>
                      <span className="sbar-val">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Security Checklist */}
            <div className="chk-card">
              <div className="p-head" style={{ padding: '13px 18px' }}>
                <div className="p-title"><Shield size={14} />Security Checks</div>
              </div>
              {checklist.map(({ label, status, icon: Icon }) => (
                <div key={label} className="chk">
                  <div className={`chk-ico ico-${status}`}>
                    {status === 'ok' ? <Check size={11} /> : status === 'fail' ? <X size={11} /> : <Minus size={11} />}
                  </div>
                  <span className="chk-name">{label}</span>
                  <span className="chk-detail">{status === 'ok' ? 'Pass' : status === 'fail' ? 'Fail' : 'Check'}</span>
                </div>
              ))}
            </div>

            {/* OWASP Top 10 */}
            <div className="owasp-card">
              <div className="p-head" style={{ padding: '13px 18px' }}>
                <div className="p-title"><AlertTriangle size={14} />OWASP API Top 10</div>
              </div>
              {owaspCounts.map((item) => (
                <div key={item.label} className="oi" onClick={() => setFilter('all')}>
                  <span className="oi-num">{item.label}</span>
                  <span className="oi-name">{item.name}</span>
                  <div className="oi-track">
                    <div className="oi-fill" style={{ width: `${item.count ? (item.count / maxOwasp) * 100 : 0}%`, background: item.count > 0 ? 'var(--sev-critical)' : 'var(--border2)' }} />
                  </div>
                  <span className="oi-n">{item.count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
