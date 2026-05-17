import { ScanStatus } from '../types'

const config: Record<ScanStatus, { label: string; bg: string; color: string; dot: string; pulse?: boolean }> = {
  queued:    { label: 'Queued',    bg: 'var(--c-b1)',                   color: 'var(--c-t3)',    dot: 'var(--c-t4)' },
  running:   { label: 'Running',   bg: 'var(--c-accent-bg)',            color: 'var(--c-accent)', dot: 'var(--c-accent)', pulse: true },
  analyzing: { label: 'Analyzing', bg: 'rgba(180,130,255,0.12)',        color: '#B482FF',         dot: '#B482FF',         pulse: true },
  completed: { label: 'Completed', bg: 'rgba(34,197,94,0.12)',          color: 'var(--c-success)', dot: 'var(--c-success)' },
  failed:    { label: 'Failed',    bg: 'rgba(239,68,68,0.12)',          color: 'var(--c-danger)',  dot: 'var(--c-danger)' },
}

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status as ScanStatus] || config.queued
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold"
      style={{
        background: c.bg,
        color: c.color,
        padding: '4px 10px',
        borderRadius: '99px',
        fontSize: '11.5px',
      }}
    >
      <span
        style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: c.dot,
          display: 'inline-block',
          animation: c.pulse ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      {c.label}
    </span>
  )
}
