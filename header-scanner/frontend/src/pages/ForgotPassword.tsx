import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader2, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { CaptchaField } from '../components/CaptchaField'
import { authApi } from '../api/auth'

import { API_BASE as API } from '../config'

function MiniLogo() {
  return (
    <Link to="/"><img src="/logo-white.svg" alt="GozoBee" style={{ height: '24px' }}/></Link>
  )
}

function DevLinkBox({ keyword }: { keyword: string }) {
  const [devLink, setDevLink] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)

  const fetchDevLink = async () => {
    setFetching(true)
    try {
      const res = await fetch(`${API}/api/dev/emails`)
      if (!res.ok) return
      const emails: Array<{ to: string; subject: string; action_url: string | null }> = await res.json()
      const match = emails.find((e) => e.action_url && e.subject?.toLowerCase().includes(keyword))
      if (match?.action_url) setDevLink(match.action_url)
    } catch {
      // silently ignore — not dev mode
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchDevLink() }, [])

  return (
    <div className="bg-elevated border border-border-warm rounded-xl p-4 text-left space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-accent uppercase tracking-[0.1em]">Dev Mode — Action Link</span>
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
          <p className="text-muted text-xs break-all font-mono leading-relaxed">{devLink}</p>
          <a
            href={devLink}
            className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open Reset Link
          </a>
        </>
      ) : (
        <p className="text-muted text-xs">No link captured yet. Click refresh after a moment.</p>
      )}
    </div>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return setError('Please complete the CAPTCHA')
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword({ email, captcha_token: captchaToken })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
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
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-2xl font-black text-head mb-2 tracking-tight">Forgot your password?</h1>
            <p className="text-muted text-sm">Enter your email and we'll send you a reset link.</p>
          </div>
          {sent ? (
            <div className="card">
              <div className="text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-head font-bold mb-2">Check your email</p>
                <p className="text-muted text-sm mb-1">
                  If that email is registered, you'll receive a reset link shortly.
                </p>
                <p className="font-mono text-accent font-bold text-sm">{email}</p>
                <div className="mt-4">
                  <Link to="/login" className="text-accent hover:underline text-sm font-medium">Back to Sign In</Link>
                </div>
              </div>
              <DevLinkBox keyword="reset" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
              </div>
              <CaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading || !captchaToken} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-muted">
                <Link to="/login" className="text-accent hover:underline font-medium">Back to Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
