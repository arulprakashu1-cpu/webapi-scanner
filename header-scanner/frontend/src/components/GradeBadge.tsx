interface Props {
  grade: string | null
  size?: 'sm' | 'lg'
}

const gradeConfig: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'A+': { bg: 'linear-gradient(135deg,#059669,#10b981)', text: '#fff', border: 'rgba(16,185,129,0.4)', glow: '0 0 24px rgba(16,185,129,0.5)' },
  A:   { bg: 'linear-gradient(135deg,#16a34a,#22c55e)', text: '#fff', border: 'rgba(34,197,94,0.4)',   glow: '0 0 24px rgba(34,197,94,0.45)' },
  B:   { bg: 'linear-gradient(135deg,#ca8a04,#eab308)', text: '#000', border: 'rgba(234,179,8,0.4)',   glow: '0 0 24px rgba(234,179,8,0.4)' },
  C:   { bg: 'linear-gradient(135deg,#ea580c,#f97316)', text: '#fff', border: 'rgba(249,115,22,0.4)',  glow: '0 0 24px rgba(249,115,22,0.4)' },
  D:   { bg: 'linear-gradient(135deg,#dc2626,#ef4444)', text: '#fff', border: 'rgba(239,68,68,0.4)',   glow: '0 0 24px rgba(239,68,68,0.4)' },
  F:   { bg: 'linear-gradient(135deg,#7f1d1d,#991b1b)', text: '#fca5a5', border: 'rgba(153,27,27,0.5)', glow: '0 0 24px rgba(127,29,29,0.6)' },
}

export function GradeBadge({ grade, size = 'lg' }: Props) {
  if (!grade) return null
  const cfg = gradeConfig[grade] || { bg: '#2C2A1E', text: '#EDE8D5', border: '#3D3928', glow: 'none' }
  const dim = size === 'lg' ? 82 : 42
  const fs  = size === 'lg' ? 30 : 16
  return (
    <div
      style={{
        width: dim, height: dim, borderRadius: '50%',
        background: cfg.bg, color: cfg.text,
        boxShadow: `${cfg.glow}, 0 0 0 2px ${cfg.border}, 0 4px 16px rgba(0,0,0,0.5)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"DM Mono", monospace',
        fontSize: fs, fontWeight: 800, flexShrink: 0,
        letterSpacing: '-0.02em',
      }}
    >
      {grade}
    </div>
  )
}
