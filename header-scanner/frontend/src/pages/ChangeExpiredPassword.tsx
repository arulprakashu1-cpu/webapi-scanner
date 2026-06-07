import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { PasswordInput } from '../components/PasswordInput'
import { authApi } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { useGlobalToast } from '../App'

export function ChangeExpiredPassword() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const toast = useGlobalToast()
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirm) return setError('Passwords do not match')
    if (newPass.length < 15) return setError('Password must be at least 15 characters')
    setError('')
    setLoading(true)
    try {
      await authApi.changePassword({ current_password: current, new_password: newPass, confirm_password: confirm })
      toast.addToast('Password updated! Please sign in again.', 'success')
      await logout()
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <nav className="border-b border-border-warm bg-surface px-4 h-14 flex items-center">
        <img src="/logo-white.svg" alt="GozoBee" style={{ height: '24px' }}/>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-start gap-3 bg-accent/10 border border-accent/25 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-accent font-bold text-sm">Password expired</p>
              <p className="text-muted text-xs mt-0.5">Your password is over 90 days old. Please set a new one to continue.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h1 className="text-lg font-bold text-head">Update your password</h1>
            <PasswordInput label="Current Password" required value={current} onChange={setCurrent} />
            <PasswordInput label="New Password" required value={newPass} onChange={setNewPass} placeholder="Minimum 15 characters" hint="Cannot reuse last 5 passwords" />
            <PasswordInput label="Confirm New Password" required value={confirm} onChange={setConfirm} />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
