interface Props {
  severity: string
  size?: 'sm' | 'md'
}

const styles: Record<string, string> = {
  Critical: 'bg-red-500/12 text-red-400 border border-red-500/25',
  High:     'bg-orange-500/12 text-orange-400 border border-orange-500/25',
  Medium:   'bg-[#F5A623]/12 text-[#F5A623] border border-[#F5A623]/25',
  Low:      'bg-green-500/12 text-green-400 border border-green-500/25',
  Info:     'bg-blue-500/12 text-blue-400 border border-blue-500/25',
}

const dots: Record<string, string> = {
  Critical: 'bg-red-400',
  High:     'bg-orange-400',
  Medium:   'bg-[#F5A623]',
  Low:      'bg-green-400',
  Info:     'bg-blue-400',
}

export function SeverityBadge({ severity, size = 'md' }: Props) {
  const cls = styles[severity] || 'bg-[#302E22] text-muted border border-border-warm'
  const dot = dots[severity] || 'bg-muted'
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold font-mono uppercase tracking-wide ${cls} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {severity}
    </span>
  )
}
