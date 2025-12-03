export type CompareResult = {
  items: string[]
  attributes: string[]
  scores: Record<string, number[]>
  pros?: Record<string, string[]>
  cons?: Record<string, string[]>
  summary?: string
  confidence?: number
  sources?: string[]
}
