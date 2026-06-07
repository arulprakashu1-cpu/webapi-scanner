import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail, ExternalLink, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001'

function MiniLogo() {
  return (
    <Link to="/"><img src="/logo-white.svg" alt="GozoBee" style={{ height: '24px' }}/></Link>
  )
}

export function VerifyEmailSent() {
  const { state } = useLocation()
  const email = (state as any)?.email || ''
  const [devLink, setDevLink] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)

  const fetchDevLink = async () => {
    setFetching(true)
    try {
      const res = await fetch(`${API}/api/dev/emails`)
      if (!res.ok) return
      const emails: Array<{ to: string; subject: string; action_url: string | null }> = await res.json()
      // Find the most recent verify email for this address (or just the latest verify link)
      const match = emails.find(
        (e) => e.action_url && (e.to === email || e.subject?.toLowerCase().includes('verify'))
      )
      if (match?.action_url) setDevLink(match.action_url)
    } catch {
      // not dev mode or endpoint unavailable — silently ignore
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchDevLink() }, [])

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <nav className="border-b border-border-warm bg-surface px-4 h-14 flex items-center">
        <MiniLogo />
      </nav>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full space-y-4">
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-black text-head mb-2 tracking-tight">Check your email!</h1>
            <p className="text-muted text-sm mb-1">A verification link has been sent to:</p>
            <p className="font-mono text-accent font-bold text-sm">{email || 'your email address'}</p>
          </div>
          <p className="text-muted text-xs leading-relaxed">
            The link expires in 30 minutes. Check your spam folder if you don't see it.
          </p>

          {/* Dev mode: show the actual link */}
          <div className="bg-elevated border border-border-warm rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.1em]">Dev Mode — Verification Link</span>
              <button
                onClick={fetchDevLink}
                className="text-muted hover:text-accent transition-colors p-1 rounded-[6px] hover:bg-accent/10"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {fetching ? (
              <p className="text-muted text-xs">Fetching link…</p>
            ) : devLink ? (
              <>
                <p className="text-muted text-xs break-all font-mono leading-relaxed">
                  {devLink}
                </p>
                <a
                  href={devLink}
                  className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Click to Verify Email
                </a>
              </>
            ) : (
              <p className="text-muted text-xs">No link captured yet. Try refreshing after a moment.</p>
            )}
          </div>

          <Link to="/login" className="btn-secondary inline-block w-full text-center py-2.5">Back to Sign In</Link>
        </div>
      </div>
    </div>
  )
}
