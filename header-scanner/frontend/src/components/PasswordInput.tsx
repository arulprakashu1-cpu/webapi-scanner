import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  id?: string
  name?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  label?: string
  required?: boolean
  hint?: string
}

export function PasswordInput({ id, name, placeholder, value, onChange, label, required, hint }: Props) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="input-field pr-12"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-head transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
