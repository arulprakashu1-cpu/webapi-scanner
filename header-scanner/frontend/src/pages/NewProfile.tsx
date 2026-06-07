import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { scansApi } from '../api/scans'
import { useGlobalToast } from '../App'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'

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
      <div className="max-w-lg">
        <Link to="/dashboard" className="flex items-center gap-1 text-muted hover:text-accent text-sm mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-black text-head mb-6 tracking-tight">Add New Domain</h1>
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="label">URL <span className="text-red-400">*</span></label>
            <input
              className="input-field font-mono"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="mt-1.5 text-xs text-muted">Include https:// for accurate HSTS detection</p>
          </div>
          <div>
            <label className="label">
              Application / Site Name{' '}
              <span className="text-muted font-normal text-xs">(optional)</span>
            </label>
            <input
              className="input-field"
              type="text"
              placeholder="Auto-populated from URL if blank"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <Link to="/dashboard" className="btn-secondary flex-1 text-center py-2.5">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Plus className="w-4 h-4" />Create Profile</>}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
