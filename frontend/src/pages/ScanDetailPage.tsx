import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import FindingItem from '../components/FindingItem'
import { ScanFinding, Severity, AiAnalysis } from '../types'
import {
  ArrowLeft, CheckCircle2, XCircle, FileJson, FileText,
  Shield, AlertTriangle, Zap, ChevronDown, ChevronUp,
  Loader2, Brain, Check, X, Minus, Lock, Globe, Server,
  ShieldAlert, Clock, Activity, ExternalLink,
} from 'lucide-react'
import { formatTime, duration } from '../utils/date'
import { useAuth } from '../contexts/AuthContext'

/* ── constants ─────────────────────────────────────────── */
const SEV_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const SEV_BAR: Record<Severity, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#3b82f6',
}
const SEV_BG: Record<Severity, string> = {
  critical: 'rgba(239,68,68,0.1)', high: 'rgba(249,115,22,0.1)',
  medium: 'rgba(234,179,8,0.1)', low: 'rgba(34,197,94,0.1)', info: 'rgba(59,130,246,0.1)',
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

const SCAN_PHASES = [
  { pct: 5,   label: 'DNS & Connectivity',     icon: Globe    },
  { pct: 15,  label: 'Endpoint Discovery',      icon: Activity },
  { pct: 30,  label: 'Mapping API Surface',     icon: Shield   },
  { pct: 48,  label: 'Authentication Checks',   icon: Lock     },
  { pct: 62,  label: 'Authorization Fuzzing',   icon: ShieldAlert },
  { pct: 76,  label: 'Injection Probes',        icon: AlertTriangle },
  { pct: 88,  label: 'Data Exposure Analysis',  icon: Server   },
  { pct: 100, label: 'Compiling Report',        icon: CheckCircle2 },
]

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'CRITICAL RISK' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', label: 'HIGH RISK' },
  medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', label: 'MEDIUM RISK' },
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', label: 'LOW RISK' },
}

/* ── helpers ───────────────────────────────────────────── */
function scoreGrade(s: number) { return s >= 80 ? 'A' : s >= 65 ? 'B' : s >= 50 ? 'C' : s >= 35 ? 'D' : 'F' }
function scoreColor(s: number) { return s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#ef4444' }

function useElapsed(startAt?: string, active = true) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!active || !startAt) return
    const tick = () => {
      setSecs(Math.floor((Date.now() - new Date(startAt).getTime()) / 1000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startAt, active])
  const m = Math.floor(secs / 60), s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/* ══════════════════════════════════════════════════════════
   RUNNING STATE — full hero screen
══════════════════════════════════════════════════════════ */
function ScanRunningView({ scan }: { scan: any }) {
  const pct = scan.progress ?? 0
  const elapsed = useElapsed(scan.started_at, true)

  const activePhaseIdx = SCAN_PHASES.findIndex((ph) => pct < ph.pct)
  const currentPhase = activePhaseIdx === -1 ? SCAN_PHASES[SCAN_PHASES.length - 1] : SCAN_PHASES[activePhaseIdx]

  // SVG ring  r=70, circ≈440
  const R = 70, CIRC = 2 * Math.PI * R
  const dashOff = CIRC * (1 - pct / 100)

  const hostname = (() => {
    try { return new URL(scan.target_url).hostname } catch { return scan.target_url }
  })()

  return (
    <div style={{
      background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '20px',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Animated background glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '25%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--c-accent-bg) 0%, transparent 65%)', animation: 'pulse-glow 3s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 65%)', animation: 'pulse-glow 4s ease-in-out infinite 1s' }} />
      </div>

      <div style={{ position: 'relative', padding: '48px 56px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px', alignItems: 'center' }}>

        {/* Left: ring + target */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
          {/* Ring */}
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            {/* Outer pulse ring */}
            <div style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', border: '1px solid rgba(255,214,0,0.15)', animation: 'ring-pulse 2s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: '-24px', borderRadius: '50%', border: '1px solid rgba(255,214,0,0.08)', animation: 'ring-pulse 2s ease-out infinite 0.5s' }} />
            <svg viewBox="0 0 160 160" style={{ width: '180px', height: '180px', transform: 'rotate(-90deg)' }}>
              {/* Track */}
              <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              {/* Progress */}
              <circle
                cx="80" cy="80" r={R} fill="none"
                stroke="var(--brand)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={dashOff}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 8px rgba(255,214,0,0.5))' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '38px', fontWeight: 900, color: 'var(--brand)', lineHeight: 1, letterSpacing: '-0.03em' }}>{pct}%</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px', fontWeight: 500 }}>complete</span>
            </div>
          </div>

          {/* Current phase */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)', borderRadius: '99px', padding: '6px 14px', marginBottom: '10px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--brand)', animation: 'dot-blink 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand)' }}>{currentPhase.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={12} />{elapsed} elapsed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={12} />
                <span style={{ fontFamily: 'monospace' }}>{hostname}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: phases timeline */}
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>Scan Progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SCAN_PHASES.map((ph, i) => {
              const done    = pct > ph.pct || (i === 0 && pct >= ph.pct)
              const active  = i === activePhaseIdx
              const pending = !done && !active
              const Icon    = ph.icon
              return (
                <div key={ph.label} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px',
                  background: active ? 'rgba(255,214,0,0.08)' : 'transparent',
                  border: `1px solid ${active ? 'var(--c-accent-br)' : 'transparent'}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(255,214,0,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(255,214,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    {done
                      ? <Check size={13} color="#22c55e" />
                      : active
                      ? <Loader2 size={13} color="var(--brand)" style={{ animation: 'spin 1s linear infinite' }} />
                      : <Icon size={12} color="rgba(255,255,255,0.2)" />}
                  </div>
                  <span style={{
                    fontSize: '12.5px', fontWeight: active ? 700 : done ? 500 : 400,
                    color: done ? '#22c55e' : active ? 'var(--brand)' : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.3s',
                  }}>{ph.label}</span>
                  {done && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(34,197,94,0.6)' }}>✓</span>}
                  {active && <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: 'var(--brand)' }}>{pct}%</span>}
                </div>
              )
            })}
          </div>

          {/* Metadata strip */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: 'Auth',  value: scan.auth_type === 'none' ? 'Public' : scan.auth_type === 'bearer' ? 'Bearer' : 'API Key' },
              { label: 'Type',  value: scan.target_type === 'manual' ? 'URL Scan' : 'OpenAPI' },
              { label: 'Start', value: scan.started_at ? formatTime(scan.started_at) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '6px 12px', flex: 1 }}>
                <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function ScanDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const isPro      = (user?.plan ?? 'free') === 'pro'
  const [filter, setFilter]   = useState<Severity | 'all'>('all')
  const [exporting, setExporting] = useState(false)
  const [aiOpen, setAiOpen]   = useState(false)

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

  const filtered = filter === 'all' ? findings : findings.filter((f) => f.severity === filter)
  const summary  = scan?.severity_summary || { critical: 0, high: 0, medium: 0, low: 0, info: 0 }

  const score = scan?.security_score != null ? scan.security_score
    : findings.length === 0 ? 100
    : Math.max(0, 100 - (summary.critical||0)*22 - (summary.high||0)*10 - (summary.medium||0)*5 - (summary.low||0)*2)

  const CIRC_SCORE = 2 * Math.PI * 52
  const dashOffset = CIRC_SCORE * (1 - score / 100)

  const owaspCounts = OWASP_CATS.map((cat) => ({
    label: cat.split(': ')[0],
    name:  cat.split(': ')[1],
    count: findings.filter((f) => f.owasp_category?.includes(cat.split(':')[0])).length,
  }))
  const maxOwasp = Math.max(1, ...owaspCounts.map((o) => o.count))

  const checklist = [
    { label: 'HTTPS Enforced',    status: scan?.https_enforced ? 'ok' : scan?.status === 'completed' ? 'fail' : 'warn', icon: Lock },
    { label: 'Security Headers',  status: scan?.headers_pass === true ? 'ok' : scan?.headers_pass === false ? 'fail' : 'warn', icon: Shield },
    { label: 'CORS Policy',       status: scan?.cors_safe === true ? 'ok' : scan?.cors_safe === false ? 'fail' : 'warn', icon: Globe },
    { label: 'Authentication',    status: scan?.auth_type !== 'none' ? 'ok' : 'warn', icon: Lock },
    { label: 'No Critical Issues',status: (summary.critical||0) === 0 && scan?.status === 'completed' ? 'ok' : (summary.critical||0) > 0 ? 'fail' : 'warn', icon: ShieldAlert },
    { label: 'Rate Limiting',     status: findings.some((f) => f.owasp_category?.includes('API4')) ? 'fail' : scan?.status === 'completed' ? 'ok' : 'warn', icon: Server },
  ]

  const hostname = (() => { try { return new URL(scan?.target_url ?? '').hostname } catch { return scan?.name ?? '' } })()

  if (isLoading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '360px' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid var(--c-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    </Layout>
  )

  if (!scan) return (
    <Layout>
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--c-t3)', fontSize: '13px' }}>
        Scan not found. <Link to="/dashboard" style={{ color: 'var(--c-accent)' }}>Back to dashboard</Link>
      </div>
    </Layout>
  )

  return (
    <Layout>
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--c-t3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0, transition: 'color 0.15s' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t1)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t3)')}
      >
        <ArrowLeft size={14} /> Back to dashboard
      </button>

      {/* ── RUNNING STATE ──────────────────────────────── */}
      {isActive(scan.status) && <ScanRunningView scan={scan} />}

      {/* ── FAILED STATE ───────────────────────────────── */}
      {scan.status === 'failed' && (
        <div style={{ background: 'var(--c-card)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px', padding: '32px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <XCircle size={22} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', marginBottom: '6px' }}>Scan Failed</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--c-t3)', marginBottom: '10px' }}>{scan.error_message || 'An unexpected error occurred. Please try again.'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--c-t4)' }}>
              <Globe size={12} /><span style={{ fontFamily: 'monospace' }}>{scan.target_url}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLETED STATE ─────────────────────────────── */}
      {scan.status === 'completed' && (
        <>
          {/* Header */}
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '22px 24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--c-t1)', letterSpacing: '-0.02em' }}>{hostname}</h1>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '99px', padding: '3px 10px' }}>
                    <CheckCircle2 size={11} /> Completed
                  </span>
                  {(summary.critical || 0) > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '99px', padding: '3px 10px' }}>
                      <AlertTriangle size={11} /> {summary.critical} critical
                    </span>
                  )}
                </div>
                {scan.target_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--c-t4)', fontFamily: 'monospace' }}>
                    <Globe size={11} />{scan.target_url}
                    <a href={scan.target_url} target="_blank" rel="noreferrer" style={{ color: 'var(--c-t4)' }}><ExternalLink size={11} /></a>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {[
                  { label: 'JSON', icon: FileJson, fn: handleExportJson },
                  { label: 'CSV',  icon: FileText, fn: handleExportCsv  },
                  { label: 'PDF',  icon: FileText, fn: handleExportPdf  },
                ].map(({ label, icon: Icon, fn }) => (
                  <button key={label} onClick={fn} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--c-b1)', border: '1px solid var(--c-b2)', color: 'var(--c-t2)', cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: exporting ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (!exporting) (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)' }}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)' }
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Started',   value: scan.started_at ? formatTime(scan.started_at) : '—' },
                { label: 'Duration',  value: duration(scan.started_at, scan.finished_at) },
                { label: 'Auth',      value: scan.auth_type === 'none' ? 'None' : scan.auth_type === 'bearer' ? 'Bearer Token' : 'API Key' },
                { label: 'Type',      value: scan.target_type === 'manual' ? 'URL Scan' : 'OpenAPI Spec' },
                { label: 'Endpoints', value: scan.endpoints_count != null ? String(scan.endpoints_count) : '—' },
                { label: 'Findings',  value: String(findings.length) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--c-b1)', border: '1px solid var(--c-b2)', borderRadius: '8px', padding: '7px 13px' }}>
                  <div style={{ fontSize: '9.5px', color: 'var(--c-t4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '13px', color: 'var(--c-t1)', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>

            {/* ── LEFT ─────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* AI Analysis */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', overflow: 'hidden' }}>
                {!isPro ? (
                  <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--c-b1)', border: '1px solid var(--c-b2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Lock size={16} color="var(--c-t3)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--c-t1)' }}>AI Security Analysis</span>
                        <span style={{ fontSize: '9px', fontWeight: 800, background: 'var(--c-accent)', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>PRO</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--c-t3)' }}>Upgrade to Pro for Claude AI risk assessment, attack narrative and remediation roadmap.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setAiOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--c-accent-bg)', border: '1px solid rgba(255,214,0,0.25)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Brain size={16} color="var(--c-accent)" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '1px' }}>AI Security Analysis</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--c-t4)' }}>{aiData ? 'Analysis ready' : 'Claude AI · risk assessment + remediation roadmap'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!aiData && !aiLoading && <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--c-accent-bg)', color: 'var(--c-accent)', padding: '3px 9px', borderRadius: '6px' }}>Generate</span>}
                        {aiLoading && <Loader2 size={14} color="var(--c-accent)" style={{ animation: 'spin 1s linear infinite' }} />}
                        {aiOpen ? <ChevronUp size={15} color="var(--c-t4)" /> : <ChevronDown size={15} color="var(--c-t4)" />}
                      </div>
                    </button>
                    {aiOpen && (
                      <div style={{ borderTop: '1px solid var(--c-b1)', padding: '18px 20px' }}>
                        {aiLoading && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--c-t3)', fontSize: '13px', padding: '12px 0' }}>
                            <div style={{ width: '18px', height: '18px', border: '2px solid var(--c-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                            Claude is analysing {findings.length} findings…
                          </div>
                        )}
                        {aiData && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ background: RISK_CONFIG[aiData.risk_level]?.bg, border: `1px solid ${RISK_CONFIG[aiData.risk_level]?.border}`, borderRadius: '10px', padding: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                                <AlertTriangle size={14} color={RISK_CONFIG[aiData.risk_level]?.color} />
                                <span style={{ fontSize: '10.5px', fontWeight: 800, color: RISK_CONFIG[aiData.risk_level]?.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{RISK_CONFIG[aiData.risk_level]?.label}</span>
                                {aiData.cached && <span style={{ fontSize: '10px', color: 'var(--c-t4)', marginLeft: 'auto' }}>cached</span>}
                              </div>
                              <p style={{ fontSize: '13px', color: 'var(--c-t1)', lineHeight: 1.65 }}>{aiData.executive_summary}</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div style={{ background: 'var(--c-b1)', borderRadius: '10px', padding: '14px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Attack Narrative</div>
                                <p style={{ fontSize: '12.5px', color: 'var(--c-t2)', lineHeight: 1.6 }}>{aiData.attack_narrative}</p>
                              </div>
                              <div style={{ background: 'var(--c-b1)', borderRadius: '10px', padding: '14px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Top Priorities</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                  {aiData.top_priorities.map((p, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--c-accent)', color: '#000', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{i+1}</span>
                                      <span style={{ fontSize: '12px', color: 'var(--c-t2)', lineHeight: 1.5 }}>{p}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '14px' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Zap size={11} /> Quick Wins
                              </div>
                              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                                {aiData.quick_wins.map((w, i) => (
                                  <span key={i} style={{ fontSize: '12px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 10px', borderRadius: '7px' }}>✓ {w}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Severity stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px' }}>
                {[
                  { label: 'Total',    value: findings.length,                     color: 'var(--c-accent)', bg: 'var(--c-accent-bg)' },
                  { label: 'Critical', value: summary.critical || 0,               color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                  { label: 'High',     value: summary.high || 0,                   color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
                  { label: 'Medium',   value: summary.medium || 0,                 color: '#eab308', bg: 'rgba(234,179,8,0.08)' },
                  { label: 'Low/Info', value: (summary.low||0)+(summary.info||0),  color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color, lineHeight: 1, marginBottom: '4px' }}>{value}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--c-t4)', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Findings panel */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--c-b1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, color: 'var(--c-t1)' }}>
                    <Shield size={15} color="var(--c-accent)" /> Findings
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--c-t4)' }}>{filtered.length} of {findings.length}</span>
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '4px', padding: '10px 14px', borderBottom: '1px solid var(--c-b1)', overflowX: 'auto' }}>
                  <button onClick={() => setFilter('all')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '7px', fontSize: '12px', fontWeight: filter === 'all' ? 700 : 500, cursor: 'pointer', border: `1px solid ${filter === 'all' ? 'var(--c-accent)' : 'var(--c-b2)'}`, background: filter === 'all' ? 'var(--c-accent-bg)' : 'transparent', color: filter === 'all' ? 'var(--c-accent)' : 'var(--c-t3)', whiteSpace: 'nowrap' }}>
                    All <span style={{ background: 'var(--c-b1)', borderRadius: '4px', padding: '1px 6px', fontSize: '10.5px' }}>{findings.length}</span>
                  </button>
                  {SEV_ORDER.filter((s) => (summary[s] || 0) > 0).map((sev) => (
                    <button key={sev} onClick={() => setFilter(filter === sev ? 'all' : sev)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '7px', fontSize: '12px', fontWeight: filter === sev ? 700 : 500, cursor: 'pointer', border: `1px solid ${filter === sev ? SEV_BAR[sev] : 'var(--c-b2)'}`, background: filter === sev ? SEV_BG[sev] : 'transparent', color: filter === sev ? SEV_BAR[sev] : 'var(--c-t3)', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: SEV_BAR[sev], flexShrink: 0 }} />
                      {sev} <span style={{ background: SEV_BG[sev], borderRadius: '4px', padding: '1px 5px', fontSize: '10.5px' }}>{summary[sev]}</span>
                    </button>
                  ))}
                </div>

                {findings.length === 0 ? (
                  <div style={{ padding: '56px', textAlign: 'center' }}>
                    <CheckCircle2 size={40} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 700, color: 'var(--c-t1)', marginBottom: '5px', fontSize: '15px' }}>No vulnerabilities found</p>
                    <p style={{ fontSize: '13px', color: 'var(--c-t3)' }}>This API passed all security checks.</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--c-t3)', fontSize: '13px' }}>
                    No {filter} findings. <button onClick={() => setFilter('all')} style={{ color: 'var(--c-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Show all</button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--c-b1)' }}>
                      <tr>
                        {['Sev', 'Finding', 'Endpoint', 'Confidence', 'OWASP', ''].map((h) => (
                          <th key={h} style={{ padding: '9px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
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

            {/* ── RIGHT COLUMN ─────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '16px' }}>

              {/* Security score ring */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Security Score
                  <span style={{ fontSize: '18px', fontWeight: 900, color: scoreColor(score), letterSpacing: '-0.02em' }}>
                    {scoreGrade(score)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                    <svg viewBox="0 0 120 120" style={{ width: '110px', height: '110px', transform: 'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--c-b1)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor(score)} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={CIRC_SCORE} strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${scoreColor(score)}66)` }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '26px', fontWeight: 300, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
                      <span style={{ fontSize: '9.5px', color: 'var(--c-t4)', marginTop: '2px' }}>/100</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {SEV_ORDER.slice(0, 4).map((sev) => {
                    const count = summary[sev] || 0
                    const pct   = findings.length ? Math.round((count / findings.length) * 100) : 0
                    return (
                      <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--c-t3)', width: '52px', textTransform: 'capitalize', flexShrink: 0 }}>{sev}</span>
                        <div style={{ flex: 1, height: '4px', background: 'var(--c-b1)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: SEV_BAR[sev], borderRadius: '99px', transition: 'width 0.8s' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: SEV_BAR[sev], width: '20px', textAlign: 'right' }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Security checklist */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-b1)', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 700, color: 'var(--c-t1)' }}>
                  <Shield size={14} color="var(--c-accent)" /> Security Checks
                </div>
                {checklist.map(({ label, status }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', borderBottom: '1px solid var(--c-b1)' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: status === 'ok' ? 'rgba(34,197,94,0.15)' : status === 'fail' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
                      {status === 'ok' ? <Check size={11} color="#22c55e" /> : status === 'fail' ? <X size={11} color="#ef4444" /> : <Minus size={11} color="rgba(255,255,255,0.3)" />}
                    </div>
                    <span style={{ flex: 1, fontSize: '12px', color: 'var(--c-t2)' }}>{label}</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: status === 'ok' ? '#22c55e' : status === 'fail' ? '#ef4444' : 'var(--c-t4)' }}>
                      {status === 'ok' ? 'Pass' : status === 'fail' ? 'Fail' : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* OWASP breakdown */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-b1)', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 700, color: 'var(--c-t1)' }}>
                  <AlertTriangle size={14} color="#f97316" /> OWASP API Top 10
                </div>
                {owaspCounts.map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderBottom: '1px solid var(--c-b1)', cursor: 'pointer' }}
                    onClick={() => setFilter('all')}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: item.count > 0 ? '#ef4444' : 'var(--c-t4)', width: '32px', flexShrink: 0 }}>{item.label}</span>
                    <div style={{ flex: 1, height: '4px', background: 'var(--c-b1)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.count ? (item.count / maxOwasp) * 100 : 0}%`, background: item.count > 0 ? '#ef4444' : 'var(--c-b2)', borderRadius: '99px', transition: 'width 0.8s' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: item.count > 0 ? '#ef4444' : 'var(--c-t4)', width: '16px', textAlign: 'right' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.05); } }
        @keyframes ring-pulse { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(1.15); opacity:0; } }
        @keyframes dot-blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </Layout>
  )
}
