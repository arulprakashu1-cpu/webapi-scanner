import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import {
  ArrowLeft, Globe, Shield, Lock, Search, AlertCircle,
  ChevronDown, ChevronUp, Key, User, FileCode2, Zap,
  Clock, CheckCircle2, AlertTriangle, Info, ScanLine,
} from 'lucide-react'

/* ── Quick targets ─────────────────────────────────────── */
const QUICK_TARGETS = [
  { label: 'OWASP Petstore',  url: 'https://petstore.swagger.io/v2',         badge: 'OWASP' },
  { label: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com',    badge: 'REST'  },
  { label: 'ReqRes API',      url: 'https://reqres.in/api',                   badge: 'REST'  },
  { label: 'GitHub API',      url: 'https://api.github.com',                  badge: 'Public'},
  { label: 'Dog CEO API',     url: 'https://dog.ceo/api',                     badge: 'Public'},
  { label: 'Open-Meteo',      url: 'https://api.open-meteo.com/v1',           badge: 'REST'  },
]

/* ── Scan type options ─────────────────────────────────── */
const SCAN_TYPES = [
  { id: 'manual',   icon: Globe,     label: 'URL Scan',      desc: 'Paste any API base URL' },
  { id: 'openapi',  icon: FileCode2, label: 'OpenAPI/Swagger',desc: 'Import spec URL or file' },
  { id: 'graphql',  icon: Zap,       label: 'GraphQL',        desc: 'GraphQL endpoint introspection' },
  { id: 'grpc',     icon: ScanLine,  label: 'REST + gRPC',    desc: 'Advanced protocol support' },
]

/* ── Scan profiles ─────────────────────────────────────── */
const SCAN_PROFILES = [
  {
    id: 'quick',
    label: 'Quick',
    icon: Zap,
    color: '#10b981',
    time: '~30s',
    checks: 5,
    desc: 'Top vulnerabilities only — ideal for CI pipelines',
  },
  {
    id: 'standard',
    label: 'Standard',
    icon: Shield,
    color: 'var(--brand)',
    time: '~60s',
    checks: 10,
    desc: 'Full OWASP API Top 10 — recommended for most scans',
    default: true,
  },
  {
    id: 'deep',
    label: 'Deep',
    icon: Search,
    color: '#a78bfa',
    time: '~2min',
    checks: 17,
    desc: 'Thorough — all checks, fuzzing, injection probes',
  },
]

/* ── Auth type options ─────────────────────────────────── */
const AUTH_TYPES = [
  { id: 'none',    icon: Globe,  label: 'None',         desc: 'Public API' },
  { id: 'bearer',  icon: Key,    label: 'Bearer Token', desc: 'JWT / OAuth2' },
  { id: 'api_key', icon: Lock,   label: 'API Key',      desc: 'Header / Query' },
  { id: 'basic',   icon: User,   label: 'Basic Auth',   desc: 'Username + password' },
]

/* ── OWASP checklist ───────────────────────────────────── */
const OWASP_CHECKS = [
  { cat: 'API1',  label: 'Broken Object Level Authorization', sev: 'critical' },
  { cat: 'API2',  label: 'Broken Authentication',             sev: 'high'     },
  { cat: 'API3',  label: 'Broken Object Property Level Auth', sev: 'high'     },
  { cat: 'API4',  label: 'Unrestricted Resource Consumption', sev: 'high'     },
  { cat: 'API5',  label: 'Broken Function Level Auth',        sev: 'critical' },
  { cat: 'API6',  label: 'Sensitive Business Flow Abuse',     sev: 'medium'   },
  { cat: 'API7',  label: 'Server-Side Request Forgery',       sev: 'high'     },
  { cat: 'API8',  label: 'Security Misconfiguration',         sev: 'medium'   },
  { cat: 'API9',  label: 'Improper Inventory Management',     sev: 'medium'   },
  { cat: 'API10', label: 'Unsafe Consumption of APIs',        sev: 'high'     },
]

const SEV_DOT: Record<string, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#60a5fa',
}

export default function NewScanPage() {
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const [searchParams] = useSearchParams()
  const prefillUrl      = searchParams.get('url')       || ''
  const prefillName     = searchParams.get('name')      || ''
  const prefillAuth     = searchParams.get('auth_type') || 'none'
  const prefillAuthName = searchParams.get('auth_header_name') || ''
  // fromTarget: true means we came from the Targets page via Configure
  const fromTarget = !!searchParams.get('url')

  const [scanType,     setScanType]     = useState('manual')
  const [scanProfile,  setScanProfile]  = useState('standard')
  const [authType,     setAuthType]     = useState(
    AUTH_TYPES.some((a) => a.id === prefillAuth) ? prefillAuth : 'none'
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saveAsTarget, setSaveAsTarget] = useState(!fromTarget)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name:             prefillName,
    description:      '',
    target_url:       prefillUrl,
    openapi_url:      '',
    auth_header_name: prefillAuthName,
    auth_header_value:'',
    auth_username:    '',
    auth_password:    '',
    custom_headers:   '',
    timeout:          '30',
    follow_redirects: true,
  })

  const { data: usage   } = useQuery({ queryKey: ['usage'],   queryFn: scansApi.usage })
  const { data: savedTargets = [] } = useQuery({ queryKey: ['targets'], queryFn: scansApi.targets.list, staleTime: 30_000 })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: scansApi.create,
    onSuccess: (scan) => {
      qc.invalidateQueries({ queryKey: ['scans'] })
      navigate(`/scans/${scan.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Failed to start scan'),
  })

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim()
    if (!trimmed) return trimmed
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (/^\/\//i.test(trimmed)) return `https:${trimmed}`
    return `https://${trimmed}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const raw = scanType === 'openapi' ? form.openapi_url : form.target_url
    if (!raw.trim()) { setError('Target URL is required'); return }
    const url = normalizeUrl(raw)

    let autoName = form.name
    if (!autoName) {
      try { autoName = `${new URL(url).hostname} — ${scanProfile} scan` } catch { autoName = 'API Security Scan' }
    }

    // Save as target if the checkbox is ticked (best-effort, non-blocking)
    if (saveAsTarget) {
      try {
        await scansApi.targets.create({
          name: autoName,
          url,
          auth_type: authType === 'basic' ? 'none' : authType,
        })
        qc.invalidateQueries({ queryKey: ['targets'] })
      } catch {}
    }

    mutate({
      name:              autoName,
      description:       form.description || undefined,
      target_type:       scanType === 'manual' ? 'manual' : 'openapi',
      target_url:        url,
      auth_type:         authType === 'basic' ? 'none' : authType,
      auth_header_name:  authType === 'api_key' ? (form.auth_header_name || 'X-API-Key') : undefined,
      auth_header_value: authType !== 'none' && authType !== 'basic' ? form.auth_header_value : undefined,
    })
  }

  const limitReached = usage && usage.plan !== 'pro' && usage.monthly_scans >= usage.limit

  return (
    <Layout>
      <div style={{ width: '100%' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--c-t3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '22px', padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t1)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t3)')}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{ width: '46px', height: '46px', background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ScanLine size={22} color="var(--c-accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--c-t1)', letterSpacing: '-0.02em', marginBottom: '3px' }}>New Security Scan</h1>
            <p style={{ fontSize: '13px', color: 'var(--c-t3)' }}>
              {fromTarget
                ? <>Pre-filled from saved target — review settings then <strong style={{ color: 'var(--c-accent)' }}>Launch Security Scan</strong></>
                : 'Configure target, authentication, and scan depth — then launch'}
            </p>
          </div>
          {usage && (
            <div style={{ marginLeft: 'auto', background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '10px', padding: '10px 16px', textAlign: 'right', minWidth: '140px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-t4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Monthly Usage</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: limitReached ? 'var(--c-danger)' : 'var(--c-accent)' }}>
                {usage.monthly_scans} / {usage.plan === 'pro' ? '∞' : usage.limit}
              </div>
              <div style={{ height: '3px', background: 'var(--c-b1)', borderRadius: '99px', marginTop: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '99px', background: limitReached ? 'var(--c-danger)' : 'var(--c-accent)', width: usage.plan === 'pro' ? `${Math.min(100, (usage.monthly_scans / 100) * 100)}%` : `${Math.min(100, (usage.monthly_scans / usage.limit) * 100)}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Limit warning */}
        {limitReached && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
            <AlertCircle size={16} color="var(--c-danger)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-danger)', marginBottom: '2px' }}>Monthly scan limit reached</div>
              <p style={{ fontSize: '12px', color: 'var(--c-t3)' }}>You've used all {usage?.limit} free scans this month. <Link to="/pricing" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>Upgrade to Pro</Link> for unlimited scans.</p>
            </div>
          </div>
        )}

        {/* ── MAIN 2-COLUMN LAYOUT ──────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>

            {/* ── LEFT COLUMN ─────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--c-danger)', fontSize: '12.5px', padding: '12px 14px', borderRadius: '11px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              {/* ── 1. SCAN TYPE ──────────────────────── */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '22px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--c-accent)', color: '#000', fontSize: '10px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                  Scan Format
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {SCAN_TYPES.map(({ id, icon: Icon, label, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setScanType(id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px',
                        padding: '12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                        border: `1px solid ${scanType === id ? 'var(--c-accent)' : 'var(--c-b2)'}`,
                        background: scanType === id ? 'var(--c-accent-bg)' : 'var(--c-b1)',
                        textAlign: 'left',
                      }}
                    >
                      <Icon size={16} color={scanType === id ? 'var(--c-accent)' : 'var(--c-t3)'} />
                      <div style={{ fontSize: '12px', fontWeight: 700, color: scanType === id ? 'var(--c-t1)' : 'var(--c-t2)' }}>{label}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--c-t4)', lineHeight: 1.4 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── 2. TARGET URL ─────────────────────── */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '22px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--c-accent)', color: '#000', fontSize: '10px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                  Target
                </div>

                {/* Saved targets + demo targets */}
                <div style={{ marginBottom: '14px' }}>
                  {savedTargets.length > 0 && (
                    <>
                      <div style={{ fontSize: '11px', color: 'var(--c-accent)', marginBottom: '7px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Shield size={11} /> Your Saved Targets
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {savedTargets.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setForm((f) => ({ ...f, target_url: t.url, name: f.name || t.name }))
                              if (AUTH_TYPES.some((a) => a.id === t.auth_type)) setAuthType(t.auth_type)
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.15s',
                              border: `1px solid ${form.target_url === t.url ? 'var(--c-accent)' : 'var(--c-b2)'}`,
                              background: form.target_url === t.url ? 'var(--c-accent-bg)' : 'var(--c-b1)',
                              color: form.target_url === t.url ? 'var(--c-accent)' : 'var(--c-t1)',
                            }}
                          >
                            {t.name}
                            {t.last_security_score != null && (
                              <span style={{ fontSize: '9.5px', fontWeight: 800, color: t.last_security_score >= 70 ? '#10b981' : t.last_security_score >= 40 ? '#f59e0b' : '#ef4444', background: 'var(--c-b2)', padding: '1px 5px', borderRadius: '4px' }}>
                                {t.last_security_score}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--c-t4)', marginBottom: '7px', fontWeight: 600 }}>Demo targets</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {QUICK_TARGETS.map((t) => (
                      <button
                        key={t.url}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, target_url: t.url, name: f.name || t.label }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 500,
                          cursor: 'pointer', transition: 'all 0.15s',
                          border: `1px solid ${form.target_url === t.url ? 'var(--c-accent)' : 'var(--c-b2)'}`,
                          background: form.target_url === t.url ? 'var(--c-accent-bg)' : 'var(--c-b1)',
                          color: form.target_url === t.url ? 'var(--c-accent)' : 'var(--c-t2)',
                        }}
                      >
                        {t.label}
                        <span style={{ fontSize: '9px', fontWeight: 700, opacity: 0.6 }}>{t.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {scanType === 'openapi' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>OpenAPI / Swagger Spec URL</label>
                      <input
                        className="input"
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                        placeholder="https://petstore.swagger.io/v2/swagger.json"
                        value={form.openapi_url}
                        onChange={set('openapi_url')}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ height: '1px', flex: 1, background: 'var(--c-b2)' }} />
                      <span style={{ fontSize: '11px', color: 'var(--c-t4)' }}>or upload a file</span>
                      <div style={{ height: '1px', flex: 1, background: 'var(--c-b2)' }} />
                    </div>
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      border: '2px dashed var(--c-b2)', borderRadius: '10px', padding: '20px',
                      cursor: 'pointer', color: 'var(--c-t4)', fontSize: '12.5px', fontWeight: 500,
                      transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)')}
                    >
                      <FileCode2 size={18} />
                      Drop swagger.json / openapi.yaml here, or click to browse
                      <input type="file" accept=".json,.yaml,.yml" style={{ display: 'none' }} />
                    </label>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>
                      {scanType === 'graphql' ? 'GraphQL Endpoint URL' : scanType === 'grpc' ? 'API Base URL / gRPC Host' : 'API Base URL'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={14} color="var(--c-t4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        className="input"
                        style={{ paddingLeft: '36px', fontFamily: 'monospace', fontSize: '13px' }}
                        placeholder={
                          scanType === 'graphql' ? 'api.example.com/graphql' :
                          scanType === 'grpc' ? 'grpc.example.com:443' :
                          'api.example.com/v1  or  www.google.com'
                        }
                        value={form.target_url}
                        onChange={set('target_url')}
                        required={scanType !== 'openapi'}
                      />
                    </div>
                    {scanType === 'graphql' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11.5px', color: '#60a5fa' }}>
                        <Info size={12} />
                        Introspection query will be used to discover the schema automatically
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── 3. SCAN DETAILS ───────────────────── */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '22px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--c-accent)', color: '#000', fontSize: '10px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                  Scan Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>
                      Scan name <span style={{ color: 'var(--c-t4)', fontWeight: 400 }}>(auto if empty)</span>
                    </label>
                    <input type="text" className="input" placeholder="e.g. Production API v2" value={form.name} onChange={set('name')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>
                      Environment tag
                    </label>
                    <select className="input" style={{ cursor: 'pointer' }}>
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="dev">Development</option>
                      <option value="test">Testing / QA</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>
                    Description <span style={{ color: 'var(--c-t4)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    className="input"
                    style={{ minHeight: '64px', resize: 'none' }}
                    placeholder="Context, purpose, or notes about this scan…"
                    value={form.description}
                    onChange={set('description') as any}
                  />
                </div>
                {/* Save as target */}
                {!fromTarget && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', padding: '10px 12px', background: saveAsTarget ? 'var(--c-accent-bg)' : 'var(--c-b1)', border: `1px solid ${saveAsTarget ? 'var(--c-accent-br)' : 'var(--c-b2)'}`, borderRadius: '10px', transition: 'all 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={saveAsTarget}
                      onChange={(e) => setSaveAsTarget(e.target.checked)}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--brand)', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--c-t1)' }}>Save URL as a Target</div>
                      <div style={{ fontSize: '11px', color: 'var(--c-t4)' }}>Adds this URL to Targets so you can Quick Scan it later with one click</div>
                    </div>
                  </label>
                )}
              </div>

              {/* ── 4. AUTHENTICATION ─────────────────── */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '22px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--c-accent)', color: '#000', fontSize: '10px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                  Authentication
                </div>

                {/* Auth type selector tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '16px' }}>
                  {AUTH_TYPES.map(({ id, icon: Icon, label, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAuthType(id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                        border: `1px solid ${authType === id ? 'var(--c-accent)' : 'var(--c-b2)'}`,
                        background: authType === id ? 'var(--c-accent-bg)' : 'var(--c-b1)',
                      }}
                    >
                      <Icon size={15} color={authType === id ? 'var(--c-accent)' : 'var(--c-t3)'} />
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: authType === id ? 'var(--c-t1)' : 'var(--c-t2)' }}>{label}</span>
                      <span style={{ fontSize: '10px', color: 'var(--c-t4)' }}>{desc}</span>
                    </button>
                  ))}
                </div>

                {/* Auth fields */}
                {authType === 'bearer' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>Bearer Token</label>
                    <input type="password" className="input" style={{ fontFamily: 'monospace' }} placeholder="eyJhbGciOiJIUzI1NiIs…" value={form.auth_header_value} onChange={set('auth_header_value')} />
                  </div>
                )}
                {authType === 'api_key' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>Header Name</label>
                      <input type="text" className="input" style={{ fontFamily: 'monospace' }} placeholder="X-API-Key" value={form.auth_header_name} onChange={set('auth_header_name')} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>API Key Value</label>
                      <input type="password" className="input" style={{ fontFamily: 'monospace' }} placeholder="sk-live-…" value={form.auth_header_value} onChange={set('auth_header_value')} />
                    </div>
                  </div>
                )}
                {authType === 'basic' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>Username</label>
                      <input type="text" className="input" placeholder="admin" value={form.auth_username} onChange={set('auth_username')} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>Password</label>
                      <input type="password" className="input" placeholder="••••••••" value={form.auth_password} onChange={set('auth_password')} />
                    </div>
                  </div>
                )}
                {authType !== 'none' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px', fontSize: '11.5px', color: '#10b981' }}>
                    <Shield size={12} /> Credentials used ephemerally — never stored after scan
                  </div>
                )}
              </div>

              {/* ── 5. ADVANCED OPTIONS ───────────────── */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--c-b2)', color: 'var(--c-t3)', fontSize: '10px', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>5</span>
                    Advanced Options
                    <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--c-t4)', textTransform: 'none', letterSpacing: 0 }}>— custom headers, timeout, redirects</span>
                  </div>
                  {showAdvanced ? <ChevronUp size={15} color="var(--c-t4)" /> : <ChevronDown size={15} color="var(--c-t4)" />}
                </button>
                {showAdvanced && (
                  <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--c-b1)', paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>Request Timeout (seconds)</label>
                        <input type="number" className="input" min="5" max="120" value={form.timeout} onChange={set('timeout')} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--c-t2)', fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            checked={form.follow_redirects}
                            onChange={(e) => setForm((f) => ({ ...f, follow_redirects: e.target.checked }))}
                            style={{ width: '15px', height: '15px', accentColor: 'var(--c-accent)', cursor: 'pointer' }}
                          />
                          Follow HTTP Redirects
                        </label>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--c-t3)', marginBottom: '6px' }}>
                        Custom Request Headers <span style={{ color: 'var(--c-t4)', fontWeight: 400 }}>(one per line: Header: Value)</span>
                      </label>
                      <textarea
                        className="input"
                        style={{ minHeight: '72px', resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
                        placeholder={'X-Tenant-ID: acme\nX-Environment: production'}
                        value={form.custom_headers}
                        onChange={set('custom_headers') as any}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN ────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '16px' }}>

              {/* Scan profile */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Scan Profile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SCAN_PROFILES.map(({ id, icon: Icon, label, color, time, checks, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setScanProfile(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px', borderRadius: '11px', cursor: 'pointer', transition: 'all 0.15s',
                        border: `1px solid ${scanProfile === id ? color : 'var(--c-b2)'}`,
                        background: scanProfile === id ? color + '12' : 'var(--c-b1)',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', background: color + '20', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-t1)' }}>{label}</span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color, background: color + '18', padding: '1px 6px', borderRadius: '4px' }}>{time}</span>
                          <span style={{ fontSize: '10px', color: 'var(--c-t4)', marginLeft: 'auto' }}>{checks} checks</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--c-t4)', lineHeight: 1.4 }}>{desc}</div>
                      </div>
                      {scanProfile === id && <CheckCircle2 size={15} color={color} style={{ flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* OWASP checklist */}
              <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>What Gets Tested</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--c-accent-bg)', color: 'var(--c-accent)', padding: '2px 8px', borderRadius: '5px' }}>OWASP API 2023</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {OWASP_CHECKS.map(({ cat, label, sev }) => {
                    const active = scanProfile === 'quick' ? ['API1','API2','API4','API5','API8'].includes(cat)
                                 : scanProfile === 'deep'   ? true
                                 : true // standard = all
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: active ? 1 : 0.35 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: SEV_DOT[sev], flexShrink: 0 }} />
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--c-t4)', width: '36px', flexShrink: 0 }}>{cat}</span>
                        <span style={{ fontSize: '11px', color: active ? 'var(--c-t2)' : 'var(--c-t4)' }}>{label}</span>
                        {active && <CheckCircle2 size={11} color="#10b981" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--c-b1)', display: 'flex', gap: '12px', fontSize: '10.5px', color: 'var(--c-t4)' }}>
                  {[['critical','#ef4444'], ['high','#f59e0b'], ['medium','#60a5fa']].map(([s, c]) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c }} />
                      <span style={{ textTransform: 'capitalize' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={isPending || !!limitReached}
                className="btn-yellow"
                style={{ width: '100%', padding: '14px', fontSize: '14px', borderRadius: '12px' }}
              >
                {isPending ? (
                  <>
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                    Initialising scan…
                  </>
                ) : limitReached ? (
                  <><AlertCircle size={16} /> Scan limit reached</>
                ) : (
                  <><ScanLine size={16} strokeWidth={2.5} /> Launch Security Scan</>
                )}
              </button>

              {/* Scan info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {[
                  { icon: Clock,         text: SCAN_PROFILES.find(p => p.id === scanProfile)?.time ?? '~60s', label: 'Duration' },
                  { icon: Shield,        text: String(SCAN_PROFILES.find(p => p.id === scanProfile)?.checks ?? 10), label: 'Checks' },
                  { icon: AlertTriangle, text: 'OWASP 2023', label: 'Standard' },
                ].map(({ icon: Icon, text, label }) => (
                  <div key={label} style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <Icon size={13} color="var(--c-t4)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '1px' }}>{text}</div>
                    <div style={{ fontSize: '10px', color: 'var(--c-t4)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
