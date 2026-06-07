import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react'
import { Layout } from '../components/Layout'
import { GradeBadge } from '../components/GradeBadge'
import { SeverityBadge } from '../components/SeverityBadge'
import { scansApi, ScanFinding } from '../api/scans'

const SEVERITY_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low', 'Info']

export function ScanDetail() {
  const { profileId, runId } = useParams<{ profileId: string; runId: string }>()
  const rid = Number(runId)
  const pid = Number(profileId)
  const [filter, setFilter] = useState('All')

  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ['run', rid],
    queryFn: () => scansApi.getRun(rid).then((r) => r.data),
    enabled: !!rid,
  })

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['findings', rid],
    queryFn: () => scansApi.getRunFindings(rid).then((r) => r.data),
    enabled: !!rid,
  })

  const filtered = filter === 'All' ? findings : findings.filter((f: ScanFinding) => f.severity === filter)

  const statusIcon = (status: string) => {
    if (status === 'present')   return <CheckCircle className="w-4 h-4 text-green-400" />
    if (status === 'missing')   return <XCircle className="w-4 h-4 text-red-400" />
    if (status === 'info_leak') return <AlertTriangle className="w-4 h-4 text-[#F5A623]" />
    return <span className="w-4 h-4 text-muted">—</span>
  }

  const statusLabel = (status: string) => {
    if (status === 'present')   return 'Present'
    if (status === 'missing')   return 'Missing'
    if (status === 'info_leak') return 'Info Leak'
    if (status === 'not_present') return 'Not Present'
    return status
  }

  if (runLoading) return (
    <Layout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div></Layout>
  )

  return (
    <Layout>
      <div className="space-y-6">
        <Link to={`/dashboard/${pid}`} className="flex items-center gap-1 text-muted hover:text-accent text-sm transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        {/* Run summary */}
        {run && (
          <div className="card">
            <div className="flex items-start gap-6 flex-wrap">
              <GradeBadge grade={run.grade} size="lg" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-head">{run.scan_name || 'Scan'}</h1>
                <p className="font-mono text-xs text-muted mt-1">{run.target_url}</p>
                <p className="text-xs text-muted mt-1">{new Date(run.scanned_at).toLocaleString()}</p>
                <div className="flex flex-wrap gap-4 mt-3">
                  {[
                    { label: 'Critical', count: run.critical_count, color: 'text-red-400' },
                    { label: 'High',     count: run.high_count,     color: 'text-orange-400' },
                    { label: 'Medium',   count: run.medium_count,   color: 'text-[#F5A623]' },
                    { label: 'Low',      count: run.low_count,      color: 'text-green-400' },
                    { label: 'Info',     count: run.info_count,     color: 'text-muted' },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className={`text-xl font-black font-mono ${s.color}`}>{s.count}</div>
                      <div className="text-[11px] text-muted">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scansApi.downloadReport(rid, 'json')} className="btn-secondary text-xs py-1.5 px-3">JSON</button>
                <button onClick={() => scansApi.downloadReport(rid, 'pdf')} className="btn-secondary text-xs py-1.5 px-3">PDF</button>
              </div>
            </div>

            {/* VT results */}
            {run.vt_verdict && (
              <div className="mt-5 border-t border-border-warm pt-4">
                <p className="text-[10px] text-accent font-bold uppercase tracking-[0.08em] mb-2">VirusTotal</p>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    run.vt_verdict === 'CLEAN'      ? 'bg-green-500/15 text-green-400' :
                    run.vt_verdict === 'SUSPICIOUS' ? 'bg-[#F5A623]/15 text-[#F5A623]' :
                    'bg-red-500/15 text-red-400'
                  }`}>{run.vt_verdict}</span>
                  <span className="text-xs text-muted">Malicious: <span className="text-red-400 font-bold">{run.vt_malicious ?? '—'}</span></span>
                  <span className="text-xs text-muted">Suspicious: <span className="text-[#F5A623] font-bold">{run.vt_suspicious ?? '—'}</span></span>
                  <span className="text-xs text-muted">Harmless: <span className="text-green-400 font-bold">{run.vt_harmless ?? '—'}</span></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === f
                  ? 'bg-accent text-[#1A1109] border-accent shadow-accent-glow'
                  : 'bg-elevated text-muted border-border-warm hover:border-accent/50 hover:text-accent'
              }`}
            >
              {f}{f !== 'All' && (
                <span className="ml-1 opacity-60">{findings.filter((fi: ScanFinding) => fi.severity === f).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Findings table */}
        {findingsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-elevated border-b border-border-warm">
                  <tr>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3 w-8">#</th>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3">Status</th>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3">Header / Vulnerability</th>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3">Severity</th>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3 hidden md:table-cell">Standard</th>
                    <th className="text-right text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {filtered.map((f: ScanFinding, i: number) => (
                    <tr key={f.id} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-4 py-3 text-muted text-xs">{i + 1}</td>
                      <td className="px-4 py-3">{statusIcon(f.status)}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-head">{f.header_name}</span>
                        {f.status === 'missing'   && <span className="ml-2 text-xs text-red-400 font-medium">Missing</span>}
                        {f.status === 'info_leak' && <span className="ml-2 text-xs text-[#F5A623] font-medium">Info Leak</span>}
                      </td>
                      <td className="px-4 py-3"><SeverityBadge severity={f.severity} size="sm" /></td>
                      <td className="px-4 py-3 text-xs text-muted hidden md:table-cell">{f.standard || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/dashboard/${pid}/scan/${runId}/finding/${f.id}`}
                          className="text-xs text-accent hover:underline inline-flex items-center gap-0.5 font-medium"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-10 text-center text-muted text-sm">No findings for this filter.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
