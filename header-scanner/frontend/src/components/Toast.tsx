import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Toast as ToastType } from '../hooks/useToast'

interface Props {
  toasts: ToastType[]
  onRemove: (id: string) => void
}

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />,
  error:   <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
  info:    <Info className="w-4 h-4 text-blue-400 shrink-0" />,
}

const borders = {
  success: 'border-green-500/30',
  error:   'border-red-500/30',
  warning: 'border-yellow-500/30 border-accent/30',
  info:    'border-blue-500/30',
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 bg-elevated border ${borders[t.type]} rounded-xl px-4 py-3 shadow-warm-md animate-slide-in`}
        >
          {icons[t.type]}
          <p className="text-sm text-head flex-1 leading-snug">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="text-muted hover:text-head transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
