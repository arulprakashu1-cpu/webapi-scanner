import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.full_name)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Brand card */}
        <div style={{
          background: 'var(--c-card2)', border: '1px solid var(--c-b1)',
          borderRadius: '18px', padding: '28px', marginBottom: '16px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              background: 'var(--c-accent)', borderRadius: '12px',
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={22} color="#000" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 900, fontSize: '20px', color: 'var(--c-t1)', lineHeight: 1 }}>ScanAPI</div>
              <div style={{ fontSize: '10px', color: 'var(--c-t3)' }}>Security Scanner</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--c-t3)', marginTop: '4px' }}>Create your free account</p>
        </div>

        {/* Register card */}
        <div style={{ background: 'var(--c-card)', border: '1px solid var(--c-b1)', borderRadius: '18px', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--c-danger)', fontSize: '12.5px', padding: '10px 12px', borderRadius: '10px',
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <input type="text" className="input" placeholder="Alex Chen" value={form.full_name} onChange={set('full_name')} />
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-yellow"
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '10px', marginTop: '4px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                    borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block',
                  }} />
                  Creating account…
                </span>
              ) : 'Create free account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--c-t3)', marginTop: '16px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
