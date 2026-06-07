import { useRef, useEffect } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'
const IS_DEV_KEY = SITE_KEY === '10000000-ffff-ffff-ffff-000000000001'

interface Props {
  onVerify: (token: string) => void
  onExpire?: () => void
}

export function CaptchaField({ onVerify, onExpire }: Props) {
  const ref = useRef<HCaptcha>(null)

  // In dev mode with the test site key, auto-verify immediately
  useEffect(() => {
    if (IS_DEV_KEY) {
      onVerify('dev-bypass-token')
    }
  }, [])

  if (IS_DEV_KEY) {
    return (
      <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-[10px] px-4 py-2.5">
        <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="#1A1109" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="text-xs text-accent font-semibold">CAPTCHA verified (dev mode)</span>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <HCaptcha
        ref={ref}
        sitekey={SITE_KEY}
        onVerify={onVerify}
        onExpire={() => { onExpire?.(); ref.current?.resetCaptcha() }}
        theme="dark"
        size="normal"
      />
    </div>
  )
}
