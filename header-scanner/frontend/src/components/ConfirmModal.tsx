import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}

export function ConfirmModal({
  open, title, message, confirmLabel = 'Confirm', danger = false,
  onConfirm, onCancel, children
}: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface border border-border-warm rounded-2xl p-6 w-full max-w-md shadow-warm-md">
        <button onClick={onCancel} className="absolute top-4 right-4 text-muted hover:text-head transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-head mb-2">{title}</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">{message}</p>
        {children}
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className={`flex-1 font-bold px-6 py-2.5 rounded-[10px] transition-colors ${
              danger ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
