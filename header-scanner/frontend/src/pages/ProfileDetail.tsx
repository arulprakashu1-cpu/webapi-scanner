import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Scan, Save, Plus, X, Loader2, Download, Eye, Trash2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { GradeBadge } from '../components/GradeBadge'
import { ConfirmModal } from '../components/ConfirmModal'
import { scansApi, ScanRun } from '../api/scans'
import { useGlobalToast } from '../App'
import { useAuth } from '../hooks/useAuth'

export function ProfileDetail() {
  const { profileId } = useParams<{ profileId: string }>()
  const id = Number(profileId)
  const toast = useGlobalToast()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [scanName, setScanName] = useState('')
  const [siteName, setSiteName] = useState('')
  const [customHeaders, setCustomHeaders] = useState<Array<{ header_key: string; header_value: string }>>([])
  const [editMode, setEditMode] = useState(false)
  const [deleteRun, setDeleteRun] = useState<ScanRun | null>(null)

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => scansApi.listProfiles().then((r) => r.data),
  })
  const profile = profiles.find((p) => p.id === id)

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ['runs', id],
    queryFn: () => scansApi.getProfileRuns(id).then((r) => r.data),
    enabled: !!id,
  })

  const deleteRunMutation = useMutation({
    mutationFn: (runId: number) => scansApi.deleteRun(runId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs', id] })
      toast.addToast('Scan deleted', 'success')
      setDeleteRun(null)
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => scansApi.updateProfile(id, {
      site_name: siteName,
      custom_headers: customHeaders,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
      toast.addToast('Profile saved', 'success')
      setEditMode(false)
    },
    onError: (err: any) => {
      toast.addToast(err.response?.data?.detail || 'Save failed', 'error')
    },
  })

  const startEdit = () => {
    if (!profile) return
    setSiteName(profile.site_name || '')
    setCustomHeaders(profile.custom_headers.map((h) => ({ header_key: h.header_key, header_value: h.header_value })))
    setEditMode(true)
  }

  const handleScan = async () => {
    setScanning(true)
    try {
      const resp = await scansApi.runScan(id, scanName || undefined)
      const { run, oldest_deleted } = resp.data
      if (oldest_deleted) toast.addToast('Oldest scan deleted (free plan: 2 results max)', 'info')
      toast.addToast(`Scan complete — Grade: ${run.grade}`, 'success')
      qc.invalidateQueries({ queryKey: ['runs', id] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    } catch (err: any) {
      toast.addToast(err.response?.data?.detail || 'Scan failed', 'error')
    } finally {
      setScanning(false)
    }
  }

  const addCustomHeader = () => {
    if (customHeaders.length >= 3) return toast.addToast('Maximum 3 custom headers per profile', 'warning')
    setCustomHeaders([...customHeaders, { header_key: '', header_value: '' }])
  }

  const updateHeader = (i: number, key: string, value: string) => {
    setCustomHeaders(customHeaders.map((h, idx) => idx === i ? { header_key: key, header_value: value } : h))
  }

  const removeHeader = (i: number) => setCustomHeaders(customHeaders.filter((_, idx) => idx !== i))

  const formatDate = (iso: string) => new Date(iso).toLocaleString()

  if (!profile && profiles.length > 0) return (
    <Layout>
      <div className="text-muted py-20 text-center">
        Profile not found. <Link to="/dashboard" className="text-accent hover:underline">Go back</Link>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="space-y-6">
        <Link to="/dashboard" className="flex items-center gap-1 text-muted hover:text-accent text-sm transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        {/* Profile header */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-head">{profile?.site_name || profile?.url}</h1>
              <p className="font-mono text-xs text-muted mt-1">{profile?.url}</p>
              {user?.plan === 'free' && (
                <p className="text-xs text-blue-400 mt-2">Free plan: {profile?.custom_headers.length || 0}/3 custom headers used</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {!editMode ? (
                <button onClick={startEdit} className="btn-secondary text-sm py-2 px-4">Edit Settings</button>
              ) : (
                <>
                  <button onClick={() => setEditMode(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                  <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit mode */}
          {editMode && (
            <div className="mt-5 space-y-4 border-t border-border-warm pt-5">
              <div>
                <label className="label">Site Name</label>
                <input className="input-field" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Auto-populated from URL if blank" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Custom Headers ({customHeaders.length}/3)</label>
                  <button onClick={addCustomHeader} className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {customHeaders.map((h, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="input-field flex-1 text-xs" value={h.header_key} onChange={(e) => updateHeader(i, e.target.value, h.header_value)} placeholder="Header-Name" />
                    <input className="input-field flex-1 text-xs" value={h.header_value} onChange={(e) => updateHeader(i, h.header_key, e.target.value)} placeholder="value" />
                    <button onClick={() => removeHeader(i)} className="text-muted hover:text-red-400 px-2 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Run scan */}
        <div className="card">
          <h2 className="font-bold text-head mb-4">Run New Scan</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              className="input-field flex-1 min-w-[200px]"
              placeholder="Scan name (optional, e.g. Weekly Check)"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
            />
            <button onClick={handleScan} disabled={scanning} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              {scanning ? <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</> : <><Scan className="w-4 h-4" />Run Scan</>}
            </button>
          </div>
        </div>

        {/* Scan history */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border-warm flex items-center justify-between">
            <h2 className="font-bold text-head">Scan History</h2>
            {user?.plan === 'free' && <span className="text-xs text-muted">Free plan: 2 results stored</span>}
          </div>
          {runsLoading && <div className="py-8 text-center"><Loader2 className="w-5 h-5 text-accent animate-spin mx-auto" /></div>}
          {!runsLoading && runs.length === 0 && (
            <div className="py-10 text-center text-muted text-sm">No scans yet. Run your first scan above.</div>
          )}
          {runs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-elevated">
                  <tr>
                    {['#', 'Date & Time', 'Grade', 'Critical', 'High', 'Medium', 'Low', 'Info', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className={`text-left text-[10px] text-accent font-bold uppercase tracking-[0.08em] px-4 py-3 ${
                          i === 0 ? 'pl-6' : ''
                        } ${
                          i >= 3 && i <= 4 ? 'hidden sm:table-cell' : ''
                        } ${
                          i >= 5 && i <= 6 ? 'hidden md:table-cell' : ''
                        } ${
                          i === 7 ? 'hidden lg:table-cell' : ''
                        } ${
                          i === 8 ? 'text-right pr-6' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {runs.map((r, i) => (
                    <tr key={r.id} className="hover:bg-elevated/50 transition-colors">
                      <td className="pl-6 px-4 py-3 text-muted text-xs">{i + 1}</td>
                      <td className="px-4 py-3 text-xs text-head">{formatDate(r.scanned_at)}</td>
                      <td className="px-4 py-3"><GradeBadge grade={r.grade} size="sm" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className={`font-bold font-mono text-xs ${r.critical_count > 0 ? 'text-red-400' : 'text-muted'}`}>{r.critical_count}</span></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className={`font-bold font-mono text-xs ${r.high_count > 0 ? 'text-orange-400' : 'text-muted'}`}>{r.high_count}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className={`font-bold font-mono text-xs ${r.medium_count > 0 ? 'text-[#F5A623]' : 'text-muted'}`}>{r.medium_count}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className={`font-bold font-mono text-xs ${r.low_count > 0 ? 'text-green-400' : 'text-muted'}`}>{r.low_count}</span></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><span className="font-bold font-mono text-xs text-muted">{r.info_count}</span></td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/dashboard/${profileId}/scan/${r.id}`} className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <div className="relative group">
                            <button className="p-1.5 text-muted hover:text-head hover:bg-elevated rounded-lg transition-colors" title="Download report">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-elevated border border-border-warm rounded-xl overflow-hidden shadow-warm-md z-10 hidden group-hover:block min-w-[100px]">
                              <button onClick={() => scansApi.downloadReport(r.id, 'json')} className="block w-full text-left px-4 py-2 text-xs text-head hover:bg-surface transition-colors">JSON</button>
                              <button onClick={() => scansApi.downloadReport(r.id, 'pdf')} className="block w-full text-left px-4 py-2 text-xs text-head hover:bg-surface transition-colors">PDF</button>
                            </div>
                          </div>
                          <button onClick={() => setDeleteRun(r)} className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteRun}
        title="Delete Scan"
        message="Are you sure you want to delete this scan? All findings will be permanently removed."
        confirmLabel="Delete Scan"
        danger
        onConfirm={() => deleteRun && deleteRunMutation.mutate(deleteRun.id)}
        onCancel={() => setDeleteRun(null)}
      />
    </Layout>
  )
}
