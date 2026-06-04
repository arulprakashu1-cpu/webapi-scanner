import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ScanFinding } from '../types'
import SeverityBadge from './SeverityBadge'

const severityColor: Record<string, string> = {
  critical: '#FF4444',
  high:     '#FF8C00',
  medium:   'var(--brand)',
  low:      '#22C55E',
  info:     '#60A5FA',
}

export default function FindingItem({ finding, index }: { finding: ScanFinding; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const borderColor = severityColor[finding.severity.toLowerCase()] || 'var(--c-t4)'

  return (
    <tr
      className="table-row"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <td style={{ paddingLeft: '12px' }}>
        <SeverityBadge severity={finding.severity} />
      </td>
      <td>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <span style={{ color: expanded ? 'var(--c-accent)' : 'var(--c-t1)', fontSize: '13.5px', fontWeight: 500, lineHeight: '1.4' }}>
            {finding.title}
          </span>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div style={{
            marginTop: '12px', padding: '14px',
            background: 'var(--c-nav)', borderRadius: '10px', border: '1px solid var(--c-b1)',
          }}>
            {finding.description && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '10.5px', color: 'var(--c-accent)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                }}>
                  Description
                </div>
                <p style={{ fontSize: '13px', color: 'var(--c-t2)', lineHeight: '1.6' }}>{finding.description}</p>
              </div>
            )}
            {finding.remediation && (
              <div style={{
                padding: '12px', background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px',
              }}>
                <div style={{
                  fontSize: '10.5px', color: 'var(--c-success)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                }}>
                  Remediation
                </div>
                <p style={{ fontSize: '13px', color: 'var(--c-t2)', lineHeight: '1.6' }}>{finding.remediation}</p>
              </div>
            )}
          </div>
        )}
      </td>
      <td>
        {finding.method && finding.endpoint ? (
          <div>
            <span style={{
              fontSize: '10.5px', fontWeight: 700, color: 'var(--c-accent)',
              background: 'var(--c-accent-bg)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px',
            }}>
              {finding.method}
            </span>
            <span style={{
              fontSize: '11.5px', color: 'var(--c-t3)', fontFamily: 'monospace',
              display: 'block', marginTop: '4px', maxWidth: '220px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {finding.endpoint}
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--c-t4)' }}>—</span>
        )}
      </td>
      <td>
        {finding.confidence ? (
          <span style={{
            fontSize: '11.5px', fontWeight: 600, textTransform: 'capitalize',
            color: finding.confidence === 'high' ? 'var(--c-success)'
              : finding.confidence === 'medium' ? 'var(--c-accent)'
              : 'var(--c-t3)',
          }}>
            {finding.confidence}
          </span>
        ) : <span style={{ color: 'var(--c-t4)' }}>—</span>}
      </td>
      <td>
        <div>
          {finding.owasp_category && (
            <div style={{
              fontSize: '11px', color: 'var(--c-t2)', marginBottom: '3px',
              maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {finding.owasp_category.split(' - ')[0]}
            </div>
          )}
          {finding.cwe_id && (
            <span style={{ fontSize: '10.5px', color: 'var(--c-t3)', fontFamily: 'monospace' }}>{finding.cwe_id}</span>
          )}
        </div>
      </td>
      <td>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: expanded ? 'var(--c-accent-bg)' : 'var(--c-b1)',
            border: '1px solid',
            borderColor: expanded ? 'var(--c-accent)' : 'var(--c-b2)',
            borderRadius: '6px', padding: '5px 8px', cursor: 'pointer',
            color: expanded ? 'var(--c-accent)' : 'var(--c-t3)',
            transition: 'all 0.15s',
          }}
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </td>
    </tr>
  )
}
