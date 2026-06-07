import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { PasswordInput } from '../components/PasswordInput'
import { CaptchaField } from '../components/CaptchaField'
import { authApi } from '../api/auth'
import { useGlobalToast } from '../App'
import { PRO_URL } from '../config'


const PERKS = [
  'Up to 2 scan profiles on free plan',
  '14 security headers analyzed per scan',
  'PDF & JSON report export',
  'VirusTotal URL reputation check',
]

export function Register() {
  const navigate = useNavigate()
  const toast = useGlobalToast()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', confirm_password: '', company: '',
  })
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return setError('Please complete the CAPTCHA')
    if (form.password !== form.confirm_password) return setError('Passwords do not match')
    if (form.password.length < 15) return setError('Password must be at least 15 characters')
    setError('')
    setLoading(true)
    try {
      await authApi.register({ ...form, captcha_token: captchaToken })
      navigate('/verify-email-sent', { state: { email: form.email } })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Navbar */}
      <nav style={{ background: '#161B22', borderBottom: '1px solid #30363D', boxShadow: '0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)', position: 'sticky', top: 0, zIndex: 40 }} className="px-4 h-14 flex items-center">
        <Link to="/" className="flex items-center">
          <img src="/logo-white.svg" alt="GozoBee" style={{ height: '28px', display: 'block' }} />
        </Link>
      </nav>

      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 rounded-full px-4 py-1.5 text-accent text-xs font-bold mb-5 tracking-wide uppercase">
              Free forever · No credit card required
            </div>
            <h1 className="text-2xl font-black text-head mb-2 tracking-tight">Create your free account</h1>
            <p className="text-muted text-sm">
              Header Scanner v1 is free.{' '}
              <a href={`${PRO_URL}/register`} className="text-accent hover:underline font-semibold">
                Need Pro API scanning?
              </a>
            </p>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {PERKS.map((p) => (
              <div key={p} className="flex items-center gap-2 text-xs text-body-text">
                <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                {p}
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '20px', padding: '28px', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.55)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name <span className="text-red-400">*</span></label>
                <input
                  className="input-field"
                  value={form.first_name}
                  onChange={(e) => set('first_name')(e.target.value)}
                  required
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="label">Last Name <span className="text-red-400">*</span></label>
                <input
                  className="input-field"
                  value={form.last_name}
                  onChange={(e) => set('last_name')(e.target.value)}
                  required
                  placeholder="Smith"
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address <span className="text-red-400">*</span></label>
              <input
                className="input-field"
                type="email"
                value={form.email}
                onChange={(e) => set('email')(e.target.value)}
                required
                placeholder="jane@company.com"
              />
            </div>

            <PasswordInput
              label="Password"
              required
              value={form.password}
              onChange={set('password')}
              placeholder="Minimum 15 characters"
              hint="Must be at least 15 characters. Passphrases are encouraged."
            />
            <PasswordInput
              label="Confirm Password"
              required
              value={form.confirm_password}
              onChange={set('confirm_password')}
              placeholder="Repeat your password"
            />

            <div>
              <label className="label">
                Company <span className="text-muted font-normal text-xs">(optional)</span>
              </label>
              <input
                className="input-field"
                value={form.company}
                onChange={(e) => set('company')(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>

            <CaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-4 py-3 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-[14px]"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : 'Create Free Account'}
            </button>

            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:underline font-semibold">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
