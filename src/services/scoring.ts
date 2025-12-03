export function weightedScore(scores: number[], weights: number[]) {
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) return 0
  const sum = scores.reduce((acc, s, i) => acc + (s * (weights[i] ?? 0)), 0)
  return Math.round((sum / totalWeight) * 100) / 100
}
