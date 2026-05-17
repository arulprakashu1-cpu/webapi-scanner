const config: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: '#FF4444', bg: 'rgba(255,68,68,0.12)' },
  high:     { label: 'High',     color: '#FF8C00', bg: 'rgba(255,140,0,0.12)' },
  medium:   { label: 'Medium',   color: 'var(--c-accent)', bg: 'var(--c-accent-bg)' },
  low:      { label: 'Low',      color: 'var(--c-success)', bg: 'rgba(34,197,94,0.12)' },
  info:     { label: 'Info',     color: 'var(--c-info)', bg: 'rgba(96,165,250,0.12)' },
}

export default function SeverityBadge({ severity }: { severity: string }) {
  const c = config[severity.toLowerCase()] || config.info
  return (
    <span
      className="inline-flex items-center font-bold"
      style={{
        background: c.bg,
        color: c.color,
        padding: '3px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {c.label}
    </span>
  )
}
