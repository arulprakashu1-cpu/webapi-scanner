import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import { AdminUser, AdminScan } from '../../types'
import {
  Shield, Users, Activity, AlertTriangle, CheckCircle2,
  XCircle, LogOut, RefreshCw, Search, ChevronDown,
  Zap, Clock, Globe, TrendingUp, UserCheck, UserX,
  Crown, CreditCard, Ban, ToggleLeft, ToggleRight,
  Eye, ScanLine, Calendar,
} from 'lucide-react'

/* ── helpers ─────────────────────────────────────────────── */
const PAYMENT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Active'    },
  trial:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  label: 'Trial'     },
  expired:   { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  label: 'Expired'   },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Cancelled' },
  none:      { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'None'      },
}

function initials(name?: string, email?: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return (email || '?')[0].toUpperCase()
}

function ago(d?: string) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24); if (dy < 30) return `${dy}d ago`
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ── Stat Card ───────────────────────────────────────────── */
function StatCard({ icon: Icon, color, label, value, sub }: {
  icon: React.ElementType; color: string; label: string; value: number | string; sub?: string
}) {
  return (
    <div style={{ background: '#0d0f13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ width: '32px', height: '32px', background: color + '18', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '30px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: sub ? '4px' : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.3)' }}>{sub}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const [tab,     setTab]     = useState<'users' | 'scans'>('users')
  const [filter,  setFilter]  = useState<'all' | 'free' | 'pro' | 'disabled'>('all')
  const [search,  setSearch]  = useState('')
  const [adminUser, setAdminUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const user  = localStorage.getItem('admin_user')
    if (!token || !user) { navigate('/admin'); return }
    setAdminUser(JSON.parse(user))
    // Patch api client to use admin token for these requests
  }, [navigate])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 30_000,
  })

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.users,
    staleTime: 10_000,
  })

  const { data: scansData, isLoading: scansLoading } = useQuery({
    queryKey: ['admin-scans'],
    queryFn: () => adminApi.scans(100),
    enabled: tab === 'scans',
    staleTime: 15_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users', 'admin-stats'] }),
  })

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin')
  }

  const filtered = users.filter((u) => {
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'free'     ? u.plan === 'free' && u.is_active :
      filter === 'pro'      ? u.plan === 'pro' && u.is_active :
      filter === 'disabled' ? !u.is_active : true
    const q = search.toLowerCase()
    const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: '#060709', color: '#fff', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* ── TOP BAR ──────────────────────────────────────── */}
      <div style={{ background: '#0a0c10', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '30px', height: '30px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={15} color="#ef4444" />
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>GozoBee</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Console</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { refetchUsers(); qc.invalidateQueries({ queryKey: ['admin-stats'] }) }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', transition: 'all 0.15s' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>
              {initials(adminUser?.full_name, adminUser?.email)}
            </div>
            <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)' }}>{adminUser?.email}</span>
          </div>
          <button onClick={logout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, transition: 'all 0.15s' }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 28px 48px' }}>

        {/* ── STATS GRID ───────────────────────────────── */}
        {statsLoading ? (
          <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          </div>
        ) : stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '28px' }}>
            <StatCard icon={Users}        color="#60a5fa" label="Total Users"     value={stats.total_users}          sub={`${stats.new_users_this_month} new this month`} />
            <StatCard icon={Crown}        color="#f59e0b" label="Pro Users"       value={stats.pro_users}            sub={`${stats.free_users} free`} />
            <StatCard icon={UserCheck}    color="#10b981" label="Active Users"    value={stats.active_users}         sub={`${stats.disabled_users} disabled`} />
            <StatCard icon={ScanLine}     color="#a78bfa" label="Total Scans"     value={stats.total_scans}          sub={`${stats.scans_this_month} this month`} />
            <StatCard icon={AlertTriangle}color="#ef4444" label="Total Findings"  value={stats.total_findings}       sub={`${stats.completed_scans} completed scans`} />
          </div>
        )}

        {/* Second stats row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Completion Rate', value: stats.total_scans ? `${Math.round((stats.completed_scans / stats.total_scans) * 100)}%` : '0%', color: '#10b981', icon: CheckCircle2 },
              { label: 'Pro Conversion', value: stats.total_users ? `${Math.round((stats.pro_users / stats.total_users) * 100)}%` : '0%', color: '#f59e0b', icon: TrendingUp },
              { label: 'Avg Scans / User', value: stats.total_users ? (stats.total_scans / stats.total_users).toFixed(1) : '0', color: '#60a5fa', icon: Activity },
              { label: 'Avg Findings / Scan', value: stats.completed_scans ? (stats.total_findings / stats.completed_scans).toFixed(1) : '0', color: '#a78bfa', icon: Shield },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ background: '#0d0f13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', background: color + '18', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '2px' }}>{value}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TABS ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px', background: '#0d0f13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'scans', label: 'All Scans',        icon: ScanLine },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s', background: tab === id ? 'rgba(255,255,255,0.08)' : 'none', color: tab === id ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ────────────────────────────────── */}
        {tab === 'users' && (
          <div style={{ background: '#0d0f13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'all',      label: 'All',      count: users.length },
                  { id: 'free',     label: 'Free',     count: users.filter(u => u.plan === 'free' && u.is_active).length },
                  { id: 'pro',      label: 'Pro',      count: users.filter(u => u.plan === 'pro'  && u.is_active).length },
                  { id: 'disabled', label: 'Disabled', count: users.filter(u => !u.is_active).length },
                ].map(({ id, label, count }) => (
                  <button key={id} onClick={() => setFilter(id as any)} style={{ padding: '5px 12px', borderRadius: '7px', border: `1px solid ${filter === id ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, background: filter === id ? 'rgba(239,68,68,0.12)' : 'none', color: filter === id ? '#ef4444' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {label}
                    <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0 5px', fontSize: '10.5px' }}>{count}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', position: 'relative' }}>
                <Search size={13} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', padding: '8px 14px 8px 32px', fontSize: '12.5px', color: '#fff', outline: 'none', width: '220px' }}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{filtered.length} users</span>
            </div>

            {/* Table */}
            {usersLoading ? (
              <div style={{ padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['User', 'Plan', 'Status', 'Payment', 'Scans', 'Findings', 'Joined', 'Last Login', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => {
                      const pay = PAYMENT_CONFIG[u.payment_status] || PAYMENT_CONFIG.none
                      const isUpdating = updateMutation.isPending
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', opacity: !u.is_active ? 0.55 : 1, transition: 'opacity 0.2s' }}>

                          {/* User */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: u.is_admin ? 'rgba(239,68,68,0.15)' : 'rgba(96,165,250,0.12)', border: `1px solid ${u.is_admin ? 'rgba(239,68,68,0.3)' : 'rgba(96,165,250,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: u.is_admin ? '#ef4444' : '#60a5fa', flexShrink: 0 }}>
                                {initials(u.full_name, u.email)}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{u.full_name || '—'}</span>
                                  {u.is_admin && <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 5px', borderRadius: '4px' }}>ADMIN</span>}
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Plan toggle */}
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              disabled={isUpdating || u.is_admin}
                              onClick={() => updateMutation.mutate({ id: u.id, data: { plan: u.plan === 'pro' ? 'free' : 'pro' } })}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${u.plan === 'pro' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`, background: u.plan === 'pro' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', color: u.plan === 'pro' ? '#f59e0b' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 700, cursor: u.is_admin ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                              title={u.is_admin ? 'Cannot change admin plan' : `Switch to ${u.plan === 'pro' ? 'free' : 'pro'}`}
                            >
                              {u.plan === 'pro' ? <><Zap size={11} /> Pro</> : <><Crown size={11} /> Free</>}
                            </button>
                          </td>

                          {/* Active toggle */}
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              disabled={isUpdating || u.is_admin}
                              onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '7px', border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, background: u.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: u.is_active ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: 700, cursor: u.is_admin ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                            >
                              {u.is_active
                                ? <><ToggleRight size={13} /> Active</>
                                : <><ToggleLeft size={13}  /> Disabled</>}
                            </button>
                          </td>

                          {/* Payment status */}
                          <td style={{ padding: '14px 16px' }}>
                            <select
                              value={u.payment_status}
                              disabled={isUpdating || u.is_admin}
                              onChange={(e) => updateMutation.mutate({ id: u.id, data: { payment_status: e.target.value } })}
                              style={{ background: pay.bg, border: `1px solid ${pay.color}33`, borderRadius: '7px', color: pay.color, padding: '5px 8px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', outline: 'none', appearance: 'none', paddingRight: '24px' }}
                            >
                              {Object.entries(PAYMENT_CONFIG).map(([k, v]) => (
                                <option key={k} value={k} style={{ background: '#1a1c22', color: '#fff' }}>{v.label}</option>
                              ))}
                            </select>
                          </td>

                          {/* Scans */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{u.total_scans}</span>
                          </td>

                          {/* Findings */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '13px', color: u.total_findings > 0 ? '#f97316' : 'rgba(255,255,255,0.3)', fontWeight: u.total_findings > 0 ? 700 : 400 }}>{u.total_findings}</span>
                          </td>

                          {/* Joined */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)' }}>{ago(u.created_at)}</span>
                          </td>

                          {/* Last login */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)' }}>{ago(u.last_login)}</span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {!u.is_admin && (
                                <button
                                  onClick={() => updateMutation.mutate({ id: u.id, data: { is_admin: true } })}
                                  disabled={isUpdating}
                                  style={{ padding: '5px 9px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Grant admin"
                                >
                                  <Shield size={11} /> Admin
                                </button>
                              )}
                              {!u.is_active ? (
                                <button
                                  onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: true } })}
                                  disabled={isUpdating || u.is_admin}
                                  style={{ padding: '5px 9px', borderRadius: '7px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.07)', color: '#10b981', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <UserCheck size={11} /> Enable
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: false } })}
                                  disabled={isUpdating || u.is_admin}
                                  style={{ padding: '5px 9px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)', color: 'rgba(239,68,68,0.6)', cursor: u.is_admin ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Ban size={11} /> Disable
                                </button>
                              )}
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
        )}

        {/* ── SCANS TAB ────────────────────────────────── */}
        {tab === 'scans' && (
          <div style={{ background: '#0d0f13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>All Scans — {scansData?.total ?? 0} total</span>
              <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.3)' }}>Showing latest 100</span>
            </div>
            {scansLoading ? (
              <div style={{ padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Scan Name', 'Target', 'Status', 'Score', 'Findings', 'Owner', 'Workspace', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(scansData?.scans ?? []).map((s: AdminScan, i: number) => {
                      const sc = s.security_score
                      const scoreColor = sc == null ? 'rgba(255,255,255,0.3)' : sc >= 70 ? '#10b981' : sc >= 40 ? '#f59e0b' : '#ef4444'
                      const statusColor: Record<string, string> = { completed: '#10b981', running: '#f59e0b', queued: '#60a5fa', failed: '#ef4444' }
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <ScanLine size={12} color="rgba(255,255,255,0.3)" />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{s.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', maxWidth: '180px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.target_url ? (() => { try { return new URL(s.target_url).hostname } catch { return s.target_url } })() : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor[s.status] || 'rgba(255,255,255,0.4)', background: (statusColor[s.status] || '#fff') + '18', padding: '2px 8px', borderRadius: '5px', textTransform: 'capitalize' }}>{s.status}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {sc != null ? (
                              <span style={{ fontSize: '13px', fontWeight: 800, color: scoreColor }}>{sc}</span>
                            ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: s.findings_count > 0 ? '#f97316' : 'rgba(255,255,255,0.3)' }}>{s.findings_count}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)' }}>{s.owner_email || '—'}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)' }}>{s.org_name || '—'}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.3)' }}>{ago(s.created_at)}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
