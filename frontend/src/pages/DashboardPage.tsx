import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Shield, AlertTriangle, Activity, CheckCircle2, Clock, ChevronRight, Target, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from '../utils/date'

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

  const totalFindings = scans.reduce((a, s) => a + s.findings_count, 0)
  const criticalHigh  = scans.reduce((a, s) => a + s.high_count, 0)
  const completed     = scans.filter((s) => s.status === 'completed').length
  const running       = scans.filter((s) => s.status === 'running' || s.status === 'queued')
  const history       = scans.filter((s) => s.status !== 'running' && s.status !== 'queued')

  // Build last-7-days trend data
  const trendData = (() => {
    const days: { date: string; scans: number; findings: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      const dayStr = d.toISOString().slice(0, 10)
      const dayScans = scans.filter((s) => s.created_at?.slice(0, 10) === dayStr)
      days.push({ date: label, scans: dayScans.length, findings: dayScans.reduce((a, s) => a + s.findings_count, 0) })
    }
    return days
  })()

  return (
    <Layout>
      <div style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--c-t1)', marginBottom: '4px' }}>
              Welcome back, <span style={{ color: 'var(--c-accent)' }}>{user?.full_name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--c-t3)' }}>
              {scans.length === 0 ? 'No scans yet — run your first security scan below.' : `${scans.length} scan${scans.length > 1 ? 's' : ''} in your workspace`}
            </p>
          </div>
          <Link
            to="/scans/new"
            className="btn-yellow"
            style={{ fontSize: '13px', padding: '10px 18px', borderRadius: '10px' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Scan
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <MetricCard icon={Activity} iconColor="var(--c-accent)" label="Total Scans" value={scans.length} />
          <MetricCard icon={AlertTriangle} iconColor="var(--c-danger)" label="Critical / High" value={criticalHigh} valueColor="var(--c-danger)" />
          <MetricCard icon={Shield} iconColor="var(--c-info)" label="Total Findings" value={totalFindings} valueColor="var(--c-info)" />
          <MetricCard icon={CheckCircle2} iconColor="var(--c-success)" label="Completed" value={completed} valueColor="var(--c-success)" />
        </div>

        {/* Usage bar */}
        {usage && (
          <div style={{
            background: 'var(--c-card)', border: '1px solid var(--c-b1)',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--c-t3)', fontWeight: 600, whiteSpace: 'nowrap' }}>Monthly Usage</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--c-t3)' }}>Scans used</span>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: usage.monthly_scans >= usage.limit ? 'var(--c-danger)' : 'var(--c-accent)',
                }}>
                  {usage.monthly_scans} / {usage.limit}
                </span>
              </div>
              <div style={{ width: '100%', background: 'var(--c-b1)', borderRadius: '99px', height: '5px' }}>
                <div style={{
                  height: '5px', borderRadius: '99px',
                  background: usage.monthly_scans >= usage.limit ? 'var(--c-danger)' : 'var(--c-accent)',
                  width: `${Math.min(100, (usage.monthly_scans / usage.limit) * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
            <span style={{
              fontSize: '11px', color: 'var(--c-t4)', fontWeight: 500,
              background: 'var(--c-b1)', padding: '3px 10px', borderRadius: '6px',
              whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {usage.plan}
            </span>
          </div>
        )}

        {/* Scan trend chart */}
        {scans.length > 0 && (
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-t1)' }}>Scan Activity</div>
              <div style={{ fontSize: '10.5px', color: 'var(--c-t4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last 7 days</div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD600" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FFD600" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="findingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4444" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#FF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-b1)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--c-t4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--c-t4)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--c-card)', border: '1px solid var(--c-b2)', borderRadius: '8px', fontSize: '12px', color: 'var(--c-t1)' }}
                  labelStyle={{ color: 'var(--c-t3)', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="scans" name="Scans" stroke="#FFD600" strokeWidth={2} fill="url(#scansGrad)" dot={false} />
                <Area type="monotone" dataKey="findings" name="Findings" stroke="#FF4444" strokeWidth={2} fill="url(#findingsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Running scans */}
        {running.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--c-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Running Now
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {running.map((scan) => (
                <Link
                  key={scan.id}
                  to={`/scans/${scan.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)',
                    borderRadius: '12px', padding: '14px 16px', textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent-br)')}
                >
                  <div style={{
                    width: '34px', height: '34px', background: 'var(--c-accent-bg)',
                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Loader2 size={16} color="var(--c-accent)" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--c-t1)', marginBottom: '2px' }}>{scan.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--c-t3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.target_url}</div>
                  </div>
                  <StatusBadge status={scan.status} />
                  <ChevronRight size={15} color="var(--c-t4)" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Scan History */}
        <div>
          <div style={{ fontSize: '10.5px', color: 'var(--c-t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Scan History
          </div>

          {isLoading ? (
            <div style={{
              background: 'var(--c-card)', border: '1px solid var(--c-b1)',
              borderRadius: '14px', padding: '48px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-t4)',
            }}>
              <div style={{
                width: '24px', height: '24px',
                border: '2px solid var(--c-accent)', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginBottom: '12px',
              }} />
              Loading…
            </div>
          ) : history.length === 0 ? (
            <div style={{
              background: 'var(--c-card)', border: '1px solid var(--c-b1)',
              borderRadius: '14px', padding: '56px', textAlign: 'center',
            }}>
              <div style={{
                width: '52px', height: '52px', background: 'var(--c-b1)',
                borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Target size={24} color="var(--c-t4)" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '6px' }}>No scans yet</p>
              <p style={{ fontSize: '13px', color: 'var(--c-t3)', marginBottom: '24px' }}>Run your first API security scan to see results.</p>
              <Link to="/scans/new" className="btn-yellow" style={{ fontSize: '13px', padding: '10px 20px', borderRadius: '10px', display: 'inline-flex' }}>
                <Plus size={14} />
                Start your first scan
              </Link>
            </div>
          ) : (
            <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead className="table-header">
                  <tr>
                    <th>Scan Name</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Findings</th>
                    <th>Date</th>
                    <th style={{ width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {history.map((scan) => (
                    <tr key={scan.id} className="table-row">
                      <td>
                        <Link
                          to={`/scans/${scan.id}`}
                          style={{ fontWeight: 600, color: 'var(--c-t1)', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.15s' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-accent)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t1)')}
                        >
                          {scan.name}
                        </Link>
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--c-t3)', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {scan.target_url || '—'}
                        </span>
                      </td>
                      <td><StatusBadge status={scan.status} /></td>
                      <td>
                        {scan.status === 'completed' ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {scan.high_count > 0 && (
                              <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: 'var(--c-danger)', padding: '2px 8px', borderRadius: '5px' }}>
                                {scan.high_count} H/C
                              </span>
                            )}
                            {scan.medium_count > 0 && (
                              <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--c-accent-bg)', color: 'var(--c-accent)', padding: '2px 8px', borderRadius: '5px' }}>
                                {scan.medium_count} M
                              </span>
                            )}
                            {scan.findings_count === 0 && (
                              <span style={{ fontSize: '12px', color: 'var(--c-success)', fontWeight: 600 }}>Clean</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--c-t4)', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--c-t3)' }}>
                          <Clock size={11} />
                          {formatDistanceToNow(scan.created_at)}
                        </div>
                      </td>
                      <td>
                        <Link to={`/scans/${scan.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ChevronRight size={15} color="var(--c-t4)" />
                        </Link>
                      </td>
                    </tr>
                  ))}
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

function MetricCard({ icon: Icon, iconColor, label, value, valueColor = 'var(--c-accent)' }: {
  icon: React.ElementType; iconColor: string; label: string; value: number; valueColor?: string
}) {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{
          width: '32px', height: '32px',
          background: iconColor + '22',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={iconColor} />
        </div>
        <span className="metric-label">{label}</span>
      </div>
      <div style={{ fontSize: '30px', fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
    </div>
  )
}
