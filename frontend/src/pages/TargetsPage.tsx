import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { ApiTarget } from '../types'
import {
  Plus, Target, Trash2, ExternalLink, Globe, Lock, ScanLine,
  AlertCircle, Clock, Shield, X,
} from 'lucide-react'
import { formatDistanceToNow } from '../utils/date'

const AUTH_LABELS: Record<string, string> = {
  none: 'Public',
  bearer: 'Bearer Token',
  api_key: 'API Key',
}

export default function TargetsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', description: '', auth_type: 'none' })
  const [formErr, setFormErr] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErr('')
    if (!form.url.startsWith('http')) { setFormErr('URL must start with http:// or https://'); return }
    if (!form.name.trim()) { setFormErr('Name is required'); return }
    addMutation.mutate(form)
  }

  const handleScanTarget = (t: ApiTarget) => {
    navigate(`/scans/new?url=${encodeURIComponent(t.url)}`)
  }

  const statusColor: Record<string, string> = {
    completed: 'var(--c-success)',
    running: 'var(--c-accent)',
    queued: 'var(--c-t3)',
    failed: 'var(--c-danger)',
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1060px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--c-t1)', marginBottom: '4px' }}>
              API <span style={{ color: 'var(--c-accent)' }}>Targets</span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--c-t3)' }}>
              {targets.length === 0 ? 'Save API targets to scan them repeatedly with one click.' : `${targets.length} saved target${targets.length > 1 ? 's' : ''}`}
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

        {/* Add target form */}
        {showAdd && (
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-accent-br)', borderRadius: '14px', padding: '22px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--c-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={12} />
              New API Target
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Name</label>
                  <input className="input" placeholder="Production Auth API" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
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
                <label className="label">API Base URL</label>
                <input className="input" style={{ fontFamily: 'monospace' }} placeholder="https://api.example.com/v1" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
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
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '60px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--c-b1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Target size={26} color="var(--c-t4)" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '6px' }}>No targets yet</p>
            <p style={{ fontSize: '13px', color: 'var(--c-t3)', marginBottom: '24px' }}>Save an API target to quickly re-scan it without re-entering the URL.</p>
            <button onClick={() => setShowAdd(true)} className="btn-yellow" style={{ fontSize: '13px', padding: '10px 20px', borderRadius: '10px' }}>
              <Plus size={14} />
              Add your first target
            </button>
          </div>
        )}

        {/* Target grid */}
        {!isLoading && targets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
            {targets.map((t) => (
              <TargetCard
                key={t.id}
                target={t}
                onScan={() => handleScanTarget(t)}
                onDelete={() => { setDeletingId(t.id); deleteMutation.mutate(t.id) }}
                isDeleting={deletingId === t.id}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}

function TargetCard({ target, onScan, onDelete, isDeleting }: {
  target: ApiTarget
  onScan: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const hasScans = target.total_scans > 0

  return (
    <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b1)')}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--c-t1)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--c-t3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Globe size={11} style={{ flexShrink: 0 }} />
            {target.url}
          </div>
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{ background: 'none', border: '1px solid var(--c-b2)', borderRadius: '7px', padding: '5px', cursor: 'pointer', color: 'var(--c-t4)', transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--c-danger)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--c-t4)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Description */}
      {target.description && (
        <p style={{ fontSize: '12px', color: 'var(--c-t3)', lineHeight: 1.5, margin: '-6px 0' }}>{target.description}</p>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--c-nav)', border: '1px solid var(--c-b1)', borderRadius: '7px', padding: '5px 10px' }}>
          <Lock size={10} color="var(--c-t4)" />
          <span style={{ fontSize: '11px', color: 'var(--c-t3)', fontWeight: 500 }}>{AUTH_LABELS[target.auth_type] || target.auth_type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--c-nav)', border: '1px solid var(--c-b1)', borderRadius: '7px', padding: '5px 10px' }}>
          <Shield size={10} color="var(--c-t4)" />
          <span style={{ fontSize: '11px', color: 'var(--c-t3)', fontWeight: 500 }}>{target.total_scans} scan{target.total_scans !== 1 ? 's' : ''}</span>
        </div>
        {target.last_scan_status && (
          <StatusBadge status={target.last_scan_status} />
        )}
      </div>

      {/* Last scanned */}
      {target.last_scanned_at && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--c-t4)' }}>
          <Clock size={10} />
          Last scanned {formatDistanceToNow(target.last_scanned_at)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px', borderTop: '1px solid var(--c-b1)' }}>
        <button onClick={onScan} className="btn-yellow" style={{ flex: 1, padding: '8px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 700 }}>
          <ScanLine size={13} />
          Scan Now
        </button>
        <a href={target.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '8px 12px', borderRadius: '9px', fontSize: '12px', color: 'var(--c-t3)', background: 'var(--c-b1)', border: '1px solid var(--c-b2)', textDecoration: 'none', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--c-t1)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b3)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--c-t3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-b2)' }}
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
