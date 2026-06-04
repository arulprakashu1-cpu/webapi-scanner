import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import { ApiTarget } from '../types'
import {
  Plus, Trash2, ExternalLink, Globe, Lock, ScanLine,
  AlertCircle, Clock, Shield, X, CheckCircle2, AlertTriangle,
  Activity, Target, Settings2, Zap,
} from 'lucide-react'
import { formatDistanceToNow } from '../utils/date'

const AUTH_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  none:    { label: 'Public',       color: 'var(--c-t3)',      bg: 'var(--c-b1)' },
  bearer:  { label: 'Bearer Token', color: '#60a5fa',          bg: 'rgba(96,165,250,0.1)' },
  api_key: { label: 'API Key',      color: '#a78bfa',          bg: 'rgba(167,139,250,0.1)' },
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  completed: { color: 'var(--c-success)', bg: 'rgba(16,185,129,0.1)', dot: '#10b981' },
  running:   { color: 'var(--c-accent)',  bg: 'var(--c-accent-bg)',   dot: 'var(--brand)' },
  queued:    { color: 'var(--c-t3)',      bg: 'var(--c-b1)',          dot: '#888' },
  failed:    { color: 'var(--c-danger)',  bg: 'rgba(239,68,68,0.1)',  dot: '#ef4444' },
}

function scoreColor(s: number) {
  return s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444'
}
function scoreGrade(s: number) {
  return s >= 80 ? 'A' : s >= 65 ? 'B' : s >= 50 ? 'C' : s >= 35 ? 'D' : 'F'
}

export default function TargetsPage() {
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ name: '', url: '', description: '', auth_type: 'none' })
  const [formErr, setFormErr]   = useState('')
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [quickScanId,  setQuickScanId]  = useState<string | null>(null)

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: scansApi.targets.list,
    staleTime: 30_000,
  })

  const addMutation = useMutation({
    mutationFn: scansApi.targets.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['targets'] })
      setShowAdd(false)
      setForm({ name: '', url: '', description: '', auth_type: 'none' })
      setFormErr('')
    },
    onError: (e: any) => setFormErr(e.response?.data?.detail || 'Failed to add target'),
  })

  const deleteMutation = useMutation({
    mutationFn: scansApi.targets.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['targets'] }),
    onSettled: () => setDeletingId(null),
  })

  // Quick Scan: start a scan directly from the target without opening the form
  const quickScanMutation = useMutation({
    mutationFn: (t: ApiTarget) => scansApi.create({
      name: `${t.name} — quick scan`,
      target_type: 'manual',
      target_url: t.url,
      auth_type: t.auth_type === 'basic' ? 'none' : t.auth_type,
    }),
    onSuccess: (scan) => {
      qc.invalidateQueries({ queryKey: ['scans'] })
      navigate(`/scans/${scan.id}`)
    },
    onSettled: () => setQuickScanId(null),
  })

  // Configure & Scan: go to NewScanPage with all target fields pre-filled
  const configureScan = (t: ApiTarget) => {
    const params = new URLSearchParams({
      url:       t.url,
      name:      t.name,
      auth_type: t.auth_type,
    })
    navigate(`/scans/new?${params.toString()}`)
  }

  const normalizeUrl = (raw: string) => {
    const t = raw.trim()
    if (!t) return t
    if (/^https?:\/\//i.test(t)) return t
    if (/^\/\//.test(t)) return `https:${t}`
    return `https://${t}`
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.url.trim()) { setFormErr('URL is required'); return }
    if (!form.name.trim()) { setFormErr('Name is required'); return }
    addMutation.mutate({ ...form, url: normalizeUrl(form.url) })
  }

  // Summary stats
  const totalScans     = targets.reduce((a, t) => a + t.total_scans, 0)
  const totalCompleted = targets.reduce((a, t) => a + t.completed_scans, 0)
  const totalFindings  = targets.reduce((a, t) => a + (t.last_findings_count ?? 0), 0)
  const cleanTargets   = targets.filter((t) => t.completed_scans > 0 && t.last_findings_count === 0).length

  return (
    <Layout>
      <div style={{ width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--c-t1)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              API <span style={{ color: 'var(--c-accent)' }}>Targets</span>
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--c-t3)' }}>
              {targets.length === 0
                ? 'Save API endpoints to scan them repeatedly with one click.'
                : `${targets.length} saved target${targets.length !== 1 ? 's' : ''} · ${totalScans} total scans · ${totalCompleted} completed`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="btn-yellow"
            style={{ fontSize: '13px', padding: '10px 18px', borderRadius: '10px' }}
          >
            {showAdd ? <X size={15} /> : <Plus size={15} strokeWidth={2.5} />}
            {showAdd ? 'Cancel' : 'Add Target'}
          </button>
        </div>

        {/* Summary cards */}
        {targets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { icon: Target,       color: 'var(--c-accent)',  label: 'Total Targets',    value: targets.length,   sub: 'saved endpoints' },
              { icon: Activity,     color: '#60a5fa',          label: 'Total Scans',       value: totalScans,       sub: `${totalCompleted} completed` },
              { icon: AlertTriangle,color: '#ef4444',          label: 'Last Scan Findings',value: totalFindings,    sub: 'across latest scans', valueColor: totalFindings > 0 ? '#ef4444' : '#10b981' },
              { icon: CheckCircle2, color: '#10b981',          label: 'Clean Targets',     value: cleanTargets,     sub: 'no findings', valueColor: '#10b981' },
            ].map(({ icon: Icon, color, label, value, sub, valueColor }) => (
              <div key={label} style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '30px', height: '30px', background: color + '22', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={color} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: valueColor || color, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'var(--c-t4)' }}>{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add target form */}
        {showAdd && (
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-accent-br)', borderRadius: '14px', padding: '22px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--c-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={12} /> New API Target
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: '12px' }}>
                <div>
                  <label className="label">Name</label>
                  <input className="input" placeholder="Production Auth API" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">API Base URL</label>
                  <input className="input" style={{ fontFamily: 'monospace' }} placeholder="api.example.com/v1 or www.google.com" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Auth Type</label>
                  <select className="input" value={form.auth_type} onChange={(e) => setForm((f) => ({ ...f, auth_type: e.target.value }))} style={{ cursor: 'pointer' }}>
                    <option value="none">None (public API)</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key Header</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description <span style={{ color: 'var(--c-t4)' }}>(optional)</span></label>
                <input className="input" placeholder="Brief notes about this target…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              {formErr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--c-danger)', fontSize: '12.5px', padding: '10px 14px', borderRadius: '9px' }}>
                  <AlertCircle size={13} /> {formErr}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="submit" disabled={addMutation.isPending} className="btn-yellow" style={{ padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700 }}>
                  {addMutation.isPending ? 'Saving…' : 'Save Target'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-dark" style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '13px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid var(--c-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && targets.length === 0 && (
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '72px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--c-b1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Target size={30} color="var(--c-t4)" />
            </div>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '8px' }}>No targets yet</p>
            <p style={{ fontSize: '13.5px', color: 'var(--c-t3)', marginBottom: '28px', maxWidth: '400px', margin: '0 auto 28px' }}>
              Save API endpoints to quickly re-scan them without re-entering URLs each time.
            </p>
            <button onClick={() => setShowAdd(true)} className="btn-yellow" style={{ fontSize: '13.5px', padding: '12px 24px', borderRadius: '10px' }}>
              <Plus size={15} /> Add your first target
            </button>
          </div>
        )}

        {/* Targets table */}
        {!isLoading && targets.length > 0 && (
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--c-b1)' }}>
                <tr>
                  {['Target', 'URL', 'Auth', 'Scans', 'Last Status', 'Score', 'Findings', 'Last Scanned', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '11px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {targets.map((t, idx) => {
                  const auth   = AUTH_LABELS[t.auth_type] || AUTH_LABELS.none
                  const status = t.last_scan_status ? (STATUS_CONFIG[t.last_scan_status] || STATUS_CONFIG.completed) : null
                  const sc     = t.last_security_score
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid var(--c-b1)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>

                      {/* Name + description */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--c-t1)', fontSize: '13.5px', marginBottom: '2px' }}>{t.name}</div>
                        {t.description && (
                          <div style={{ fontSize: '11.5px', color: 'var(--c-t4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{t.description}</div>
                        )}
                      </td>

                      {/* URL */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe size={11} color="var(--c-t4)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--c-t3)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.url}
                          </span>
                          <a href={t.url} target="_blank" rel="noreferrer" style={{ color: 'var(--c-t4)', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </td>

                      {/* Auth */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: auth.bg, border: `1px solid ${auth.color}22`, borderRadius: '6px', padding: '3px 8px', width: 'fit-content' }}>
                          <Lock size={10} color={auth.color} />
                          <span style={{ fontSize: '11px', fontWeight: 600, color: auth.color, whiteSpace: 'nowrap' }}>{auth.label}</span>
                        </div>
                      </td>

                      {/* Scans count */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-t1)', lineHeight: 1, marginBottom: '2px' }}>{t.total_scans}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--c-t4)' }}>{t.completed_scans} done</div>
                      </td>

                      {/* Last status */}
                      <td style={{ padding: '14px 14px' }}>
                        {status ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: status.bg, border: `1px solid ${status.color}22`, borderRadius: '6px', padding: '4px 9px', width: 'fit-content' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: status.color, textTransform: 'capitalize' }}>{t.last_scan_status}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--c-t4)' }}>Never</span>
                        )}
                      </td>

                      {/* Security score */}
                      <td style={{ padding: '14px 14px' }}>
                        {sc != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 900, color: scoreColor(sc), lineHeight: 1 }}>{sc}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: scoreColor(sc), background: scoreColor(sc) + '18', padding: '2px 5px', borderRadius: '4px' }}>{scoreGrade(sc)}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--c-t4)' }}>—</span>
                        )}
                      </td>

                      {/* Findings from last scan */}
                      <td style={{ padding: '14px 14px' }}>
                        {t.last_findings_count != null ? (
                          t.last_findings_count === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CheckCircle2 size={13} color="#10b981" />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>Clean</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {(t.last_high_count ?? 0) > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '2px 7px', borderRadius: '5px' }}>
                                  {t.last_high_count} H/C
                                </span>
                              )}
                              {(t.last_medium_count ?? 0) > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '2px 7px', borderRadius: '5px' }}>
                                  {t.last_medium_count} M
                                </span>
                              )}
                              <span style={{ fontSize: '11px', color: 'var(--c-t3)' }}>{t.last_findings_count} total</span>
                            </div>
                          )
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--c-t4)' }}>—</span>
                        )}
                      </td>

                      {/* Last scanned */}
                      <td style={{ padding: '14px 14px' }}>
                        {t.last_scanned_at ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--c-t3)' }}>
                            <Clock size={11} />
                            {formatDistanceToNow(t.last_scanned_at)}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--c-t4)' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Quick Scan — one click, no form */}
                          <button
                            onClick={() => { setQuickScanId(t.id); quickScanMutation.mutate(t) }}
                            disabled={quickScanId === t.id}
                            className="btn-yellow"
                            style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, whiteSpace: 'nowrap' }}
                            title="Quick Scan — starts immediately with saved settings"
                          >
                            {quickScanId === t.id
                              ? <><span style={{ width: '11px', height: '11px', border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> Starting…</>
                              : <><Zap size={12} /> Quick Scan</>}
                          </button>
                          {/* Configure — opens full form pre-filled */}
                          <button
                            onClick={() => configureScan(t)}
                            className="btn-dark"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' }}
                            title="Configure & Scan — opens form pre-filled with target settings"
                          >
                            <Settings2 size={12} /> Configure
                          </button>
                          <button
                            onClick={() => { setDeletingId(t.id); deleteMutation.mutate(t.id) }}
                            disabled={deletingId === t.id}
                            style={{ background: 'none', border: '1px solid var(--c-b2)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--c-t4)', transition: 'all 0.15s' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-danger)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--c-t4)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
