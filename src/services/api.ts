export async function compare(items: string[], attributes?: string[]) {
  const base = import.meta.env.VITE_WORKER_URL || '/api/compare'
  const resp = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, attributes })
  })
  const json = await resp.json()
  return json
}
