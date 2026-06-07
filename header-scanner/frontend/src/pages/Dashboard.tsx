import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Scan, Edit2, Trash2, AlertCircle, Info, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { GradeBadge } from '../components/GradeBadge'
import { ConfirmModal } from '../components/ConfirmModal'
import { scansApi, ScanProfile } from '../api/scans'
import { useGlobalToast } from '../App'
import { useAuth } from '../hooks/useAuth'

export function Dashboard() {
  const { user } = useAuth()
  const toast = useGlobalToast()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<ScanProfile | null>(null)
  const [scanning, setScanning] = useState<number | null>(null)

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => scansApi.listProfiles().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scansApi.deleteProfile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
      toast.addToast('Profile deleted', 'success')
      setDeleteTarget(null)
    },
  })

  const handleScan = async (profile: ScanProfile) => {
    setScanning(profile.id)
    try {
      const resp = await scansApi.runScan(profile.id)
      const { run, oldest_deleted } = resp.data
      if (oldest_deleted) {
        toast.addToast('Oldest scan deleted (free plan limit of 2 results per profile)', 'info')
      }
      toast.addToast(`Scan complete — Grade: ${run.grade}`, 'success')
      qc.invalidateQueries({ queryKey: ['profiles'] })
      navigate(`/dashboard/${profile.id}`)
    } catch (err: any) {
      toast.addToast(err.response?.data?.detail || 'Scan failed', 'error')
    } finally {
      setScanning(null)
    }
  }

  const isFreeLimitReached = user?.plan === 'free' && profiles.length >= 2

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-head tracking-tight">Scan Profiles</h1>
            <p className="text-muted text-sm mt-1">Manage and scan your web application domains</p>
          </div>
          <div className="relative group">
            <Link
              to={isFreeLimitReached ? '#' : '/dashboard/new'}
              className={`btn-primary flex items-center gap-2 ${isFreeLimitReached ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <Plus className="w-4 h-4" /> Add Domain
            </Link>
            {isFreeLimitReached && (
              <div className="absolute right-0 top-full mt-2 bg-elevated border border-border-warm rounded-xl px-3 py-2 text-xs text-muted whitespace-nowrap z-10 hidden group-hover:block shadow-warm-md">
                Upgrade to Pro to add more domains
              </div>
            )}
          </div>
        </div>

        {/* Limit banner */}
        {isFreeLimitReached && (
          <div className="flex items-start gap-3 bg-accent/10 border border-accent/25 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-accent text-sm font-medium">You've reached the 2-domain limit on the free plan.</p>
              <p className="text-muted text-xs mt-0.5">
                Need more?{' '}
                <a href="http://localhost:5173/register" className="text-accent hover:underline font-semibold">
                  Upgrade to GozoBee Pro
                </a>
                {' '}for unlimited domains, full OWASP API scanning, and compliance reports.
              </p>
            </div>
          </div>
        )}

        {/* Free tier history notice */}
        {user?.plan === 'free' && profiles.length > 0 && (
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300 text-sm">Free plan stores only 2 scan results per profile. Running a 3rd scan will delete the oldest.</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && profiles.length === 0 && (
          <div className="text-center py-20" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '20px', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset,0 8px 32px rgba(0,0,0,0.55)' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Scan className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-head font-bold text-lg mb-2">No scan profiles yet</h2>
            <p className="text-muted text-sm mb-7 max-w-xs mx-auto">Add your first domain to start analyzing security headers and get your A+ to F grade.</p>
            <Link to="/dashboard/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Your First Domain
            </Link>
          </div>
        )}

        {/* Profiles table */}
        {profiles.length > 0 && (
          <div className="overflow-hidden" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '20px', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset,0 8px 32px rgba(0,0,0,0.55)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#21262D', borderBottom: '1px solid #30363D' }}>
                  <tr>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-6 py-3">Application / Site</th>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3 hidden md:table-cell">URL</th>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3">Grade</th>
                    <th className="text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3 hidden sm:table-cell">Scans</th>
                    <th className="text-right text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-elevated/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/dashboard/${p.id}`} className="font-semibold text-head hover:text-accent transition-colors">
                          {p.site_name || p.url}
                        </Link>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="font-mono text-xs text-muted truncate max-w-[200px] block">{p.url}</span>
                      </td>
                      <td className="px-4 py-4">
                        {p.latest_grade ? <GradeBadge grade={p.latest_grade} size="sm" /> : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="px-4 py-4 text-muted text-sm hidden sm:table-cell">{p.scan_count}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/dashboard/${p.id}`}
                            className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-[9px] transition-colors"
                            title="Edit / View"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleScan(p)}
                            disabled={scanning === p.id}
                            className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-[9px] transition-colors disabled:opacity-50"
                            title="Run scan"
                          >
                            {scanning === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-[9px] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Profile"
        message={`Are you sure you want to delete "${deleteTarget?.site_name || deleteTarget?.url}"? This will also delete all scan history for this profile.`}
        confirmLabel="Delete Profile"
        danger
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  )
}
