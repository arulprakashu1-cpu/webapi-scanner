import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { authApi } from '../api/auth'
import { useGlobalToast } from '../App'

import { API_BASE as API } from '../config'

function MiniLogo() {
  return (
    <Link to="/"><img src="/logo-white.svg" alt="GozoBee" style={{ height: '24px' }}/></Link>
  )
}

export function VerificationExpired() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const toast = useGlobalToast()

  const fetchDevLink = async () => {
    setFetching(true)
    try {
      const res = await fetch(`${API}/api/dev/emails`)
      if (!res.ok) return
      const emails: Array<{ to: string; subject: string; action_url: string | null }> = await res.json()
      const match = emails.find((e) => e.action_url && e.subject?.toLowerCase().includes('verify'))
      if (match?.action_url) setDevLink(match.action_url)
    } catch {
      // silently ignore
    } finally {
      setFetching(false)
    }
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.resendVerification(email)
      setSent(true)
      toast.addToast('Verification link resent! Check your email.', 'success')
      setTimeout(fetchDevLink, 500)
    } catch {
      toast.addToast('Could not resend. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <nav className="border-b border-border-warm bg-surface px-4 h-14 flex items-center">
        <MiniLogo />
      </nav>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full space-y-4">
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-black text-head mb-2 tracking-tight">Link Expired</h1>
            <p className="text-muted text-sm">Your verification link has expired. Enter your email to receive a new one.</p>
          </div>
          {!sent ? (
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <input
                className="input-field"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : 'Resend Verification Link'}
              </button>
            </form>
          ) : (
            <>
              <p className="text-green-400 text-sm font-medium">New link sent to <span className="font-mono">{email}</span></p>

              {/* Dev link box */}
              <div className="bg-elevated border border-border-warm rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-[0.1em]">Dev Mode — Verification Link</span>
                  <button onClick={fetchDevLink} className="text-muted hover:text-accent transition-colors p-1 rounded-[6px] hover:bg-accent/10" title="Refresh">
                    <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {fetching ? (
                  <p className="text-muted text-xs">Fetching link…</p>
                ) : devLink ? (
                  <>
                    <p className="text-muted text-xs break-all font-mono leading-relaxed">{devLink}</p>
                    <a href={devLink} className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-sm">
                      <ExternalLink className="w-4 h-4" /> Click to Verify Email
                    </a>
                  </>
                ) : (
                  <p className="text-muted text-xs">No link captured yet. Click refresh.</p>
                )}
              </div>
            </>
          )}
          <Link to="/login" className="text-sm text-accent hover:underline font-medium block">Back to Sign In</Link>
        </div>
      </div>
    </div>
  )
}
