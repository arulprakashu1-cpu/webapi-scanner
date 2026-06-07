import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { PasswordInput } from '../components/PasswordInput'
import { ConfirmModal } from '../components/ConfirmModal'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../api/auth'
import { useGlobalToast } from '../App'
import { User, Lock, Trash2, Loader2, Save } from 'lucide-react'

export function UserProfile() {
  const { user, logout, refreshUser } = useAuth()
  const toast = useGlobalToast()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [company, setCompany] = useState(user?.company || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [showPwModal, setShowPwModal] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await authApi.updateProfile({ first_name: firstName, last_name: lastName, company })
      await refreshUser()
      toast.addToast('Profile updated', 'success')
    } catch {
      toast.addToast('Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) return setPwError('Passwords do not match')
    if (newPw.length < 15) return setPwError('Password must be at least 15 characters')
    setPwError('')
    setSavingPw(true)
    try {
      await authApi.changePassword({ current_password: currentPw, new_password: newPw, confirm_password: confirmPw })
      toast.addToast('Password changed. Please sign in again.', 'success')
      await logout()
      navigate('/login')
    } catch (err: any) {
      setPwError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await authApi.deleteAccount({ reason: deleteReason || undefined })
      await logout()
      navigate('/')
    } catch {
      toast.addToast('Failed to delete account. Please try again.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl space-y-8">
        <h1 className="text-2xl font-black text-head tracking-tight">Account Settings</h1>

        {/* Profile info */}
        <div className="card">
          <h2 className="font-bold text-head mb-5 flex items-center gap-2">
            <div className="w-7 h-7 bg-accent/15 rounded-lg flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-accent" />
            </div>
            Profile Information
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input-field opacity-60 cursor-not-allowed" value={user?.email || ''} readOnly />
              <p className="text-xs text-muted mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input-field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1">
                <span className="text-xs text-muted">Plan: </span>
                <span className="text-xs font-bold text-accent capitalize">{user?.plan}</span>
              </div>
              <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2 py-2">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <h2 className="font-bold text-head mb-5 flex items-center gap-2">
            <div className="w-7 h-7 bg-accent/15 rounded-lg flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-accent" />
            </div>
            Change Password
          </h2>
          {!showPwModal ? (
            <button onClick={() => setShowPwModal(true)} className="btn-secondary py-2 px-4">Change Password</button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordInput label="Current Password" value={currentPw} onChange={setCurrentPw} required />
              <PasswordInput label="New Password" value={newPw} onChange={setNewPw} required placeholder="Minimum 15 characters" hint="Cannot reuse last 5 passwords" />
              <PasswordInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} required />
              {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowPwModal(false); setPwError('') }} className="btn-secondary flex-1 py-2">Cancel</button>
                <button type="submit" disabled={savingPw} className="btn-primary flex-1 py-2 flex items-center justify-center gap-2">
                  {savingPw ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Danger zone */}
        <div className="card border-red-500/20">
          <h2 className="font-bold text-red-400 mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone
          </h2>
          <p className="text-muted text-sm mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button onClick={() => setShowDeleteModal(true)} className="btn-danger py-2 px-4 text-sm">Delete My Account</button>
        </div>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your scan profiles, history, and data will be deleted."
        confirmLabel={deleting ? 'Deleting...' : 'Delete My Account'}
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      >
        <div className="mt-2">
          <label className="label">Why are you leaving? (optional)</label>
          <textarea
            className="input-field resize-none text-sm"
            rows={3}
            placeholder="Your feedback helps us improve..."
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
          />
        </div>
      </ConfirmModal>
    </Layout>
  )
}
