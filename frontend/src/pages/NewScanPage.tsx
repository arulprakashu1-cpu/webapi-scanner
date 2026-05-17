import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scansApi } from '../api/scans'
import Layout from '../components/Layout'
import { AlertCircle, ArrowLeft, Globe, Info, Lock, Search, Shield } from 'lucide-react'

const QUICK_TARGETS = [
  { label: 'OWASP Petstore', url: 'https://petstore.swagger.io/v2' },
  { label: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com' },
  { label: 'ReqRes API', url: 'https://reqres.in/api' },
  { label: 'GitHub API', url: 'https://api.github.com' },
]

export default function NewScanPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', description: '', target_url: '',
    target_type: 'manual', auth_type: 'none',
    auth_header_name: '', auth_header_value: '',
  })
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: scansApi.create,
    onSuccess: (scan) => {
      qc.invalidateQueries({ queryKey: ['scans'] })
      navigate(`/scans/${scan.id}`)
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Failed to create scan'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.target_url.trim()) { setError('Target URL is required'); return }
    if (!form.target_url.startsWith('http')) { setError('URL must start with http:// or https://'); return }
    mutate({
      name: form.name || `Scan – ${new URL(form.target_url).hostname}`,
      description: form.description || undefined,
      target_type: form.target_type,
      target_url: form.target_url,
      auth_type: form.auth_type,
      auth_header_name: form.auth_header_name || undefined,
      auth_header_value: form.auth_header_value || undefined,
    })
  }

  return (
    <Layout>
      <div style={{ maxWidth: '680px' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: 'var(--c-t3)', background: 'none', border: 'none',
            cursor: 'pointer', marginBottom: '24px', padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t1)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--c-t3)')}
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-br)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Shield size={20} color="var(--c-accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--c-t1)', marginBottom: '2px' }}>New Security Scan</h1>
            <p style={{ fontSize: '13px', color: 'var(--c-t3)' }}>Configure your API target and start scanning</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Info */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)',
            borderRadius: '12px', padding: '14px 16px',
          }}>
            <Info size={15} color="var(--c-info)" style={{ marginTop: '1px', flexShrink: 0 }} />
            <p style={{ fontSize: '12.5px', color: 'var(--c-t2)', lineHeight: 1.6 }}>
              The scan will test OWASP API Top 10 vulnerabilities against your target. Auth credentials are used ephemerally and never stored.
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--c-danger)', fontSize: '12.5px', padding: '12px 14px', borderRadius: '10px',
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Scan URL card */}
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '20px' }}>
            <div style={{
              fontSize: '10.5px', color: 'var(--c-accent)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Globe size={12} />
              Enter API URL
            </div>

            {/* Quick targets */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--c-t3)', marginBottom: '8px' }}>Quick demo targets:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {QUICK_TARGETS.map((t) => (
                  <button
                    key={t.url}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, target_url: t.url, name: f.name || t.label }))}
                    style={{
                      padding: '5px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                      borderColor: form.target_url === t.url ? 'var(--c-accent)' : 'var(--c-b2)',
                      background: form.target_url === t.url ? 'var(--c-accent-bg)' : 'var(--c-b1)',
                      color: form.target_url === t.url ? 'var(--c-accent)' : 'var(--c-t2)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="url"
                className="input"
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                placeholder="https://api.example.com/v1"
                value={form.target_url}
                onChange={set('target_url')}
                required
              />
              <button
                type="button"
                className="btn-dark"
                style={{ whiteSpace: 'nowrap', borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px' }}
              >
                <Globe size={13} />
                Scan Current Page
              </button>
            </div>
          </div>

          {/* Scan details */}
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--c-t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
              Scan Details
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label">Scan name <span style={{ color: 'var(--c-t4)' }}>(auto-generated if empty)</span></label>
                <input type="text" className="input" placeholder="e.g. Production Auth API v2" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="label">Description <span style={{ color: 'var(--c-t4)' }}>(optional)</span></label>
                <textarea
                  className="input"
                  style={{ minHeight: '68px', resize: 'none' as const }}
                  placeholder="Any notes about this scan..."
                  value={form.description}
                  onChange={set('description') as any}
                />
              </div>
            </div>
          </div>

          {/* Auth */}
          <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '14px', padding: '20px' }}>
            <div style={{
              fontSize: '10.5px', color: 'var(--c-t3)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Lock size={11} />
              Authentication
            </div>
            <div>
              <label className="label">Auth type</label>
              <select className="input" value={form.auth_type} onChange={set('auth_type')} style={{ cursor: 'pointer' }}>
                <option value="none">None (public API)</option>
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key Header</option>
              </select>
            </div>

            {form.auth_type !== 'none' && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.auth_type === 'api_key' && (
                  <div>
                    <label className="label">Header name</label>
                    <input
                      type="text"
                      className="input"
                      style={{ fontFamily: 'monospace' }}
                      placeholder="X-API-Key"
                      value={form.auth_header_name}
                      onChange={set('auth_header_name')}
                    />
                  </div>
                )}
                <div>
                  <label className="label">{form.auth_type === 'bearer' ? 'Bearer token' : 'Header value'}</label>
                  <input
                    type="password"
                    className="input"
                    style={{ fontFamily: 'monospace' }}
                    placeholder={form.auth_type === 'bearer' ? 'eyJhbGciOiJIUzI1NiIs…' : 'your-api-key'}
                    value={form.auth_header_value}
                    onChange={set('auth_header_value')}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--c-t4)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={11} />
                    Never stored — used only during this scan
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="btn-yellow"
            style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 800, borderRadius: '12px', marginTop: '4px' }}
          >
            {isPending ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                  borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block',
                }} />
                Starting scan…
              </span>
            ) : (
              <>
                <Search size={16} strokeWidth={2.5} />
                Scan URL
              </>
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
