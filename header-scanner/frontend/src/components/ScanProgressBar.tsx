import { useEffect, useState } from 'react'

const STEPS = [
  'Connecting to server...',
  'Fetching HTTP headers...',
  'Analyzing security headers...',
  'Calculating grade...',
  'Checking VirusTotal...',
  'Compiling results...',
]

interface Props {
  active: boolean
}

export function ScanProgressBar({ active }: Props) {
  const [progress, setProgress] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    if (!active) {
      setProgress(0)
      setStepIdx(0)
      return
    }
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 3
        if (next >= 90) return 90
        return next
      })
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1))
    }, 400)
    return () => clearInterval(interval)
  }, [active])

  if (!active) return null

  return (
    <div className="space-y-2 my-4">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-accent font-mono font-medium">{STEPS[stepIdx]}</span>
        <span className="text-muted font-mono">{progress}%</span>
      </div>
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden border border-border-warm">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #D4881A, #F5A623, #FDB94A)',
          }}
        />
      </div>
    </div>
  )
}
