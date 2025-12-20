export async function compare(items: string[], attributes?: string[], retries = 3) {
  const base = import.meta.env.VITE_WORKER_URL || 'https://ai-compare-worker.bsse23094.workers.dev/api/compare'
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(base, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ items, attributes }),
        cache: 'no-store'
      })
      
      const json = await resp.json()
      
      // If the API returns a 503 (overloaded) or 429 (rate limited), retry after a delay
      if (!json.ok && (json.code === 503 || resp.status === 503 || resp.status === 429)) {
        if (attempt < retries) {
          const delay = json.retryAfter ? json.retryAfter * 1000 : (attempt + 1) * 2000
          console.log(`API overloaded, retrying in ${delay/1000}s... (attempt ${attempt + 1}/${retries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
      
      return json
    } catch (err) {
      if (attempt < retries) {
        const delay = (attempt + 1) * 2000
        console.log(`Request failed, retrying in ${delay/1000}s... (attempt ${attempt + 1}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw err
    }
  }
  
  return { ok: false, error: 'Max retries exceeded' }
}
