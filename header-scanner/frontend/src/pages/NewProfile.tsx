import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { scansApi } from '../api/scans'
import { useGlobalToast } from '../App'
import { ArrowLeft, Loader2, Globe, Plus } from 'lucide-react'

export function NewProfile() {
  const navigate = useNavigate()
  const toast = useGlobalToast()
  const [url, setUrl] = useState('')
  const [siteName, setSiteName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return setError('URL is required')
    const finalUrl = url.startsWith('http') ? url : `https://${url}`
    setError('')
    setLoading(true)
    try {
      const resp = await scansApi.createProfile({ url: finalUrl, site_name: siteName || undefined })
      toast.addToast('Profile created!', 'success')
      navigate(`/dashboard/${resp.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="animate-fade-up">

        {/* Back button — full-width row, pinned left */}
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-1.5 text-sm text-muted hover:text-head transition-colors duration-150 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Dashboard
        </Link>

        {/* Centered panel */}
        <div className="flex justify-center">
          <div className="w-full max-w-[440px]">

            {/* Page header — centered */}
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.22)' }}
              >
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <h1 className="text-2xl font-black text-head tracking-tight">Add New Domain</h1>
              <p className="text-sm text-muted mt-1">
                Scan and monitor HTTP security headers for any website.
              </p>
            </div>

            {/* Form card */}
            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="label">
                    Website URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="input-field font-mono"
                    type="text"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError('') }}
                    required
                    autoFocus
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Include{' '}
                    <code
                      className="text-accent rounded px-1 py-0.5 text-[11px] font-mono"
                      style={{ background: 'rgba(245,166,35,0.1)' }}
                    >
                      https://
                    </code>
                    {' '}for accurate HSTS detection.
                  </p>
                </div>

                <div className="border-t border-border-warm" />

                <div>
                  <label className="label">
                    Site Name{' '}
                    <span className="text-muted font-normal normal-case tracking-normal text-[11px]">
                      — optional
                    </span>
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="e.g. Production, My App, Staging"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-muted">Auto-populated from the URL if left blank.</p>
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2.5 text-sm text-red-400 rounded-[10px] px-4 py-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <span className="shrink-0">⚠</span>
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Link to="/dashboard" className="btn-secondary flex-1 text-center py-2.5 text-sm">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                      : <><Plus className="w-4 h-4" />Create Profile</>
                    }
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  )
}
