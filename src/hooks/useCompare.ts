import { useState } from 'react'
import type { CompareResult } from '../types'
import { compare } from '../services/api'

export function useCompare() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(items: string[], attributes?: string[]) {
    setLoading(true)
    setError(null)
    try {
      const res = await compare(items, attributes)
      setLoading(false)
      return res
    } catch (err: any) {
      setError(String(err))
      setLoading(false)
      return { ok: false, error: String(err) }
    }
  }

  return { run, loading, error }
}
