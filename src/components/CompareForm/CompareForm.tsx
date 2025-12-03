import React, { useState } from 'react'

type Props = {
  onResult: (res: any) => void
}

export default function CompareForm({ onResult }: Props) {
  const [a, setA] = useState('iPhone 15')
  const [b, setB] = useState('Galaxy S23')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await fetch(import.meta.env.VITE_WORKER_URL || '/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [a, b] })
      })
      const json = await resp.json()
      setLoading(false)
      onResult(json)
    } catch (err) {
      setLoading(false)
      onResult({ ok: false, error: String(err) })
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Item A — type anything" />
      <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Item B — type anything" />
      <button type="submit">{loading ? 'Analyzing...' : 'Compare'}</button>
    </form>
  )
}
