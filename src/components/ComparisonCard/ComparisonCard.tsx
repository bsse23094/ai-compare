import React, { useRef } from 'react'
import html2canvas from 'html2canvas'

type Props = {
  data: any
}

export default function ComparisonCard({ data }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  async function exportPNG() {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'compare.png'
    a.click()
  }

  if (!data) return null
  const parsed = data.result ?? data
  const items = parsed.items || []
  const attributes = parsed.attributes || []

  return (
    <div ref={ref} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
      <h3>Comparison Result</h3>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h4>{items[0]}</h4>
          <div>
            {attributes.map((attr: string, idx: number) => (
              <div key={attr} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>{attr}</div>
                <div>{(parsed.scores && parsed.scores[items[0]] && parsed.scores[items[0]][idx]) ?? '-'}</div>
              </div>
            ))}
          </div>
          <h5>Pros</h5>
          <ul>{(parsed.pros && parsed.pros[items[0]] || []).map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
        </div>
        <div style={{ width: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <strong>Summary</strong>
            <p>{parsed.summary}</p>
            <div>Confidence: {parsed.confidence ?? parsed.conf ?? '-'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4>{items[1]}</h4>
          <div>
            {attributes.map((attr: string, idx: number) => (
              <div key={attr} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>{attr}</div>
                <div>{(parsed.scores && parsed.scores[items[1]] && parsed.scores[items[1]][idx]) ?? '-'}</div>
              </div>
            ))}
          </div>
          <h5>Pros</h5>
          <ul>{(parsed.pros && parsed.pros[items[1]] || []).map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={exportPNG}>Export PNG</button>
      </div>
    </div>
  )
}
