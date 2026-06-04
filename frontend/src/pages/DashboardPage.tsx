import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import {
  Plus, Shield, AlertTriangle, Activity, CheckCircle2, Clock,
  ChevronRight, Target, Zap, Globe,
  AlertOctagon, Info,
} from 'lucide-react'
import { formatDistanceToNow, duration } from '../utils/date'


function scoreGrade(s: number) {
  return s >= 80 ? 'A' : s >= 65 ? 'B' : s >= 50 ? 'C' : s >= 35 ? 'D' : 'F'
}
function scoreColor(s: number) {
  return s >= 70 ? 'var(--c-success)' : s >= 40 ? 'var(--c-accent)' : 'var(--c-danger)'
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: scansApi.list,
    refetchInterval: (query) => {
      const data = query.state.data
      if (Array.isArray(data) && data.some((s) => s.status === 'running' || s.status === 'queued')) return 3000
      return false
    },
  })

  const { data: usage } = useQuery({ queryKey: ['usage'], queryFn: scansApi.usage })

  const completed   = scans.filter((s) => s.status === 'completed')
  const history     = completed
  const totalFindings  = scans.reduce((a, s) => a + s.findings_count, 0)
  const criticalHigh   = scans.reduce((a, s) => a + s.high_count, 0)
  const mediumCount    = scans.reduce((a, s) => a + s.medium_count, 0)
  const lowCount       = scans.reduce((a, s) => a + s.low_count, 0)
  const cleanScans     = completed.filter((s) => s.findings_count === 0).length
  const scoredScans    = completed.filter((s) => s.security_score != null)
  const avgScore       = scoredScans.length
    ? Math.round(scoredScans.reduce((a, s) => a + (s.security_score ?? 0), 0) / scoredScans.length)
    : null
  const totalEndpoints = scans.reduce((a, s) => a + (s.endpoints_count ?? 0), 0)

  // 7-day trend
  const trendData = (() => {
    const days: { date: string; scans: number; findings: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const label  = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      const dayStr = d.toISOString().slice(0, 10)
      const ds = scans.filter((s) => s.created_at?.slice(0, 10) === dayStr)
      days.push({ date: label, scans: ds.length, findings: ds.reduce((a, s) => a + s.findings_count, 0) })
    }
    return days
  })()


  const CIRC = 2 * Math.PI * 40
  const scoreVal  = avgScore ?? 0
  const dashOff   = CIRC * (1 - scoreVal / 100)

  return (
    <Layout>
      <div style={{ width: '100%' }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--c-t1)', letterSpacing: '-0.02em' }}>
                Welcome back,{' '}
                <span style={{ color: 'var(--c-accent)' }}>{user?.full_name?.split(' ')[0] || 'there'}</span>
              </h1>
              {usage && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '10px', fontWeight: 800,
                  background: usage.plan === 'pro' ? 'var(--c-accent)' : 'var(--c-b1)',
                  color: usage.plan === 'pro' ? '#000' : 'var(--c-t3)',
                  padding: '3px 9px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {usage.plan === 'pro' && <Zap size={9} />}
                  {usage.plan === 'pro' ? 'Pro' : 'Free'}
                </span>
              )}
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--c-t3)' }}>
              {scans.length === 0
                ? 'No scans yet — run your first security scan below.'
                : `${completed.length} completed scan${completed.length !== 1 ? 's' : ''} · ${totalFindings} findings · ${totalEndpoints} endpoints analysed`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link to="/targets" className="btn-dark" style={{ fontSize: '12.5px', padding: '9px 14px', borderRadius: '10px' }}>
              <Globe size={13} /> Targets
            </Link>
            <Link to="/scans/new" className="btn-yellow" style={{ fontSize: '13px', padding: '10px 18px', borderRadius: '10px' }}>
              <Plus size={15} strokeWidth={2.5} /> New Scan
            </Link>
          </div>
        </div>

        {/* ── 6 METRIC CARDS ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px', marginBottom: '20px' }}>
          <MetricCard icon={Activity}      color="var(--c-accent)"  label="Total Scans"     value={scans.length}       sub={`${scans.length - completed.length} in progress`} />
          <MetricCard icon={CheckCircle2}  color="var(--c-success)" label="Completed"        value={completed.length}   valueColor="var(--c-success)" sub="finished scans" />
          <MetricCard icon={AlertOctagon}  color="#ef4444"          label="Critical / High"  value={criticalHigh}       valueColor="#ef4444" sub="findings" />
          <MetricCard icon={AlertTriangle} color="#f59e0b"          label="Medium"           value={mediumCount}        valueColor="#f59e0b" sub="findings" />
          <MetricCard icon={Info}          color="#60a5fa"          label="Low / Info"       value={lowCount}           valueColor="#60a5fa" sub="findings" />
          <MetricCard icon={Shield}        color="#10b981"          label="Clean Scans"      value={cleanScans}         valueColor="#10b981" sub={`of ${completed.length} completed`} />
        </div>

        {/* ── ROW: CHART + POSTURE ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', marginBottom: '20px', alignItems: 'stretch' }}>

          {/* Trend chart */}
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '2px' }}>Scan Activity</div>
                <div style={{ fontSize: '11.5px', color: 'var(--c-t4)' }}>Scans and findings over the last 7 days</div>
              </div>
              <div style={{ display: 'flex', gap: '14px' }}>
                {[{ color: 'var(--brand)', label: 'Scans' }, { color: '#ef4444', label: 'Findings' }].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '11px', color: 'var(--c-t4)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="findingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-b1)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--c-t4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--c-t4)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--c-card)', border: '1px solid var(--c-b2)', borderRadius: '8px', fontSize: '12px', color: 'var(--c-t1)' }} labelStyle={{ color: 'var(--c-t3)', marginBottom: '4px' }} />
                <Area type="monotone" dataKey="scans"    name="Scans"    stroke="var(--brand)" strokeWidth={2} fill="url(#scansGrad)"    dot={false} />
                <Area type="monotone" dataKey="findings" name="Findings" stroke="#ef4444" strokeWidth={2} fill="url(#findingsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Security posture */}
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '2px' }}>Security Posture</div>
            <div style={{ fontSize: '11.5px', color: 'var(--c-t4)', marginBottom: '20px' }}>Average across all completed scans</div>

            {/* Score ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                <svg viewBox="0 0 90 90" style={{ width: '90px', height: '90px', transform: 'rotate(-90deg)' }}>
                  <circle cx="45" cy="45" r="40" fill="none" stroke="var(--c-b1)" strokeWidth="7" />
                  {avgScore != null && (
                    <circle cx="45" cy="45" r="40" fill="none"
                      stroke={scoreColor(avgScore)} strokeWidth="7"
                      strokeDasharray={CIRC} strokeDashoffset={dashOff}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s' }}
                    />
                  )}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {avgScore != null ? (
                    <>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: scoreColor(avgScore), lineHeight: 1 }}>{avgScore}</span>
                      <span style={{ fontSize: '9.5px', color: 'var(--c-t4)' }}>/100</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '16px', color: 'var(--c-t4)' }}>—</span>
                  )}
                </div>
              </div>
              <div>
                {avgScore != null && (
                  <div style={{ fontSize: '28px', fontWeight: 900, color: scoreColor(avgScore), letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>
                    Grade {scoreGrade(avgScore)}
                  </div>
                )}
                <div style={{ fontSize: '11.5px', color: 'var(--c-t4)', lineHeight: 1.5 }}>
                  {avgScore == null ? 'Complete scans to\nsee your posture' : avgScore >= 70 ? 'Good security posture' : avgScore >= 40 ? 'Needs improvement' : 'High risk — act now'}
                </div>
              </div>
            </div>

            {/* Sev bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {[
                { label: 'Critical / High', count: criticalHigh, color: '#ef4444', max: Math.max(1, criticalHigh, mediumCount, lowCount) },
                { label: 'Medium',          count: mediumCount,  color: '#f59e0b', max: Math.max(1, criticalHigh, mediumCount, lowCount) },
                { label: 'Low / Info',      count: lowCount,     color: '#10b981', max: Math.max(1, criticalHigh, mediumCount, lowCount) },
              ].map(({ label, count, color, max }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--c-t3)', width: '90px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: '5px', background: 'var(--c-b1)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: color, borderRadius: '99px', transition: 'width 0.8s' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color, width: '24px', textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>

            {/* Usage inline */}
            {usage && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--c-b1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--c-t4)' }}>Monthly scans</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-t2)' }}>
                    {usage.monthly_scans} / {usage.plan === 'pro' ? '∞' : usage.limit}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'var(--c-b1)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px',
                    background: usage.monthly_scans >= usage.limit ? 'var(--c-danger)' : 'var(--c-accent)',
                    width: usage.plan === 'pro' ? `${Math.min(100, (usage.monthly_scans / 100) * 100)}%` : `${Math.min(100, (usage.monthly_scans / usage.limit) * 100)}%`,
                    transition: 'width 0.4s',
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>


        {/* ── SCAN HISTORY ────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '2px' }}>Scan History</div>
              <div style={{ fontSize: '11.5px', color: 'var(--c-t4)' }}>{history.length} completed scan{history.length !== 1 ? 's' : ''}</div>
            </div>
            {history.length > 0 && (
              <Link to="/scans/new" className="btn-dark" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '9px' }}>
                <Plus size={13} /> New Scan
              </Link>
            )}
          </div>

          {isLoading ? (
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-t4)' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid var(--c-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginBottom: '12px' }} />
              Loading…
            </div>
          ) : history.length === 0 ? (
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', padding: '64px', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: 'var(--c-b1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Target size={28} color="var(--c-t4)" />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '8px' }}>No scans yet</p>
              <p style={{ fontSize: '13.5px', color: 'var(--c-t3)', marginBottom: '28px' }}>Run your first API security scan to see results here.</p>
              <Link to="/scans/new" className="btn-yellow" style={{ fontSize: '13.5px', padding: '12px 24px', borderRadius: '10px', display: 'inline-flex' }}>
                <Plus size={15} /> Start your first scan
              </Link>
            </div>
          ) : (
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--c-b1)' }}>
                  <tr>
                    {['Scan Name', 'Target', 'Score', 'Critical/High', 'Medium', 'Low/Info', 'Endpoints', 'Duration', 'Date', ''].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 700, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((scan, idx) => {
                    const sc = scan.security_score
                    return (
                      <tr key={scan.id} style={{ borderTop: '1px solid var(--c-b1)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '13px 14px' }}>
                          <Link to={`/scans/${scan.id}`} style={{ fontWeight: 600, color: 'var(--c-t1)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s' }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-accent)')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t1)')}
                          >
                            <Shield size={12} color="var(--c-t4)" />
                            {scan.name}
                          </Link>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--c-t3)', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {scan.target_url ? new URL(scan.target_url).hostname : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          {sc != null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: scoreColor(sc), lineHeight: 1 }}>{sc}</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: scoreColor(sc), background: scoreColor(sc) + '18', padding: '1px 5px', borderRadius: '4px' }}>{scoreGrade(sc)}</span>
                            </div>
                          ) : <span style={{ color: 'var(--c-t4)', fontSize: '12px' }}>—</span>}
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          {scan.high_count > 0 ? (
                            <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '3px 9px', borderRadius: '6px' }}>{scan.high_count}</span>
                          ) : <span style={{ color: 'var(--c-success)', fontSize: '12px', fontWeight: 600 }}>0</span>}
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          {scan.medium_count > 0 ? (
                            <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '3px 9px', borderRadius: '6px' }}>{scan.medium_count}</span>
                          ) : <span style={{ color: 'var(--c-t4)', fontSize: '12px' }}>0</span>}
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--c-t3)' }}>{scan.low_count}</span>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--c-t3)' }}>
                            {scan.endpoints_count != null ? scan.endpoints_count : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--c-t4)' }}>{duration(scan.created_at, scan.finished_at)}</span>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--c-t3)' }}>
                            <Clock size={11} />
                            {formatDistanceToNow(scan.created_at)}
                          </div>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <Link to={`/scans/${scan.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight size={15} color="var(--c-t4)" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}

function MetricCard({
  icon: Icon, color, label, value, valueColor, sub,
}: {
  icon: React.ElementType
  color: string
  label: string
  value: number | string
  valueColor?: string
  sub?: string
}) {
  return (
    <div style={{
      background: 'var(--c-card)', border: '1px solid var(--c-b1)',
      borderRadius: '14px', padding: '18px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '30px', height: '30px', background: color + '22', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: valueColor || color, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--c-t4)' }}>{sub}</div>}
    </div>
  )
}
