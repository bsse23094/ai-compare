import { useState, useRef } from 'react'
import './App.css'
import LiquidEther from './components/LiquidEther/LiquidEther'
import RadarChart from './components/RadarChart/RadarChart'
import BarChart from './components/BarChart/BarChart'
import ScoreDonut from './components/ScoreDonut/ScoreDonut'
import { Trophy, Download, Zap } from 'lucide-react'
import html2canvas from 'html2canvas'

const QUICK_COMPARES = [
  { a: 'iPhone 15', b: 'Galaxy S24' },
  { a: 'Batman', b: 'Joker' },
  { a: 'Messi', b: 'Ronaldo' },
  { a: 'Ramen', b: 'Pho' },
  { a: 'React', b: 'Vue' },
]

type CompareResult = {
  items: string[]
  attributes: string[]
  scores: Record<string, Record<string, number>>
  pros?: Record<string, Record<string, string[]>>
  cons?: Record<string, Record<string, string[]>>
  winner?: string
  winnerReason?: string
  summary?: string
  confidence?: number
  sources?: string[]
}

function App() {
  const [itemA, setItemA] = useState('')
  const [itemB, setItemB] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompareResult | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  async function handleCompare(a?: string, b?: string) {
    const compareA = a || itemA
    const compareB = b || itemB
    
    if (!compareA.trim() || !compareB.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL || '/api/compare'
      const resp = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [compareA.trim(), compareB.trim()] })
      })

      const json = await resp.json()

      if (!json.ok) {
        throw new Error(json.error || 'Comparison failed')
      }

      setResult(json.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleCompare()
  }

  function handleQuickCompare(a: string, b: string) {
    setItemA(a)
    setItemB(b)
    handleCompare(a, b)
  }

  async function handleExport() {
    if (!resultsRef.current) return
    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#0a0b14',
        scale: 2
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `compare-${itemA}-vs-${itemB}.png`
      a.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  return (
    <div className="app">
      <section className="hero">
        <div className="hero__bg">
          <LiquidEther
            colors={['#5227FF', '#FF9FFC', '#B19EEF']}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>

        <div className="hero__content">
          <h1 className="hero__title">Compare</h1>
          <p className="hero__subtitle">AI-powered comparisons</p>

          <form className="compare-form" onSubmit={handleSubmit}>
            <div className="compare-form__inputs">
              <input
                type="text"
                className="compare-form__input"
                placeholder="First item"
                value={itemA}
                onChange={(e) => setItemA(e.target.value)}
              />
              <span className="compare-form__vs">VS</span>
              <input
                type="text"
                className="compare-form__input"
                placeholder="Second item"
                value={itemB}
                onChange={(e) => setItemB(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="compare-form__btn"
              disabled={loading || !itemA.trim() || !itemB.trim()}
            >
              {loading ? (
                <>
                  <Zap size={16} />
                  Analyzing
                </>
              ) : (
                'Compare'
              )}
            </button>
          </form>

          <div className="quick-chips">
            <span className="quick-chips__label">Try:</span>
            {QUICK_COMPARES.map((qc, i) => (
              <button
                key={i}
                className="quick-chip"
                onClick={() => handleQuickCompare(qc.a, qc.b)}
              >
                {qc.a} vs {qc.b}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <div className="loading">
          <div className="loading__spinner" />
          <p className="loading__text">Analyzing</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button className="error__retry" onClick={() => handleCompare()}>Try Again</button>
        </div>
      )}

      {result && (
        <section className="results" ref={resultsRef}>
          <div className="results__grid">
            {/* Item A Card */}
            <div className={`results__card results__card--a ${result.winner === result.items[0] ? 'results__card--winner' : ''}`}>
              {result.winner === result.items[0] && (
                <div className="winner-badge">
                  <Trophy size={14} />
                  WINNER
                </div>
              )}
              <h3 className="results__card-title">{result.items[0]}</h3>
              <div className="results__scores">
                {result.attributes.map((attr) => (
                  <div key={attr} className="results__score-row">
                    <span className="results__score-label">{attr}</span>
                    <span className="results__score-value">
                      {result.scores[result.items[0]]?.[attr] ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
              {result.pros?.[result.items[0]] && (
                <div className="results__pros">
                  <h4 className="results__pros-title">Pros</h4>
                  <ul className="results__pros-list">
                    {Object.values(result.pros[result.items[0]]).flat().slice(0, 5).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.cons?.[result.items[0]] && (
                <div className="results__cons">
                  <h4 className="results__cons-title">Cons</h4>
                  <ul className="results__cons-list">
                    {Object.values(result.cons[result.items[0]]).flat().slice(0, 5).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Center - Charts + Verdict */}
            <div className="results__center">
              <RadarChart data={result} />

              <div className="charts-grid">
                <BarChart data={result} />
                <ScoreDonut data={result} />
              </div>

              <div className="verdict-card">
                {result.winner && (
                  <div className="verdict-card__winner">
                    <span className="verdict-card__winner-label">Winner:</span>
                    <span className="verdict-card__winner-name">{result.winner}</span>
                  </div>
                )}
                {result.winnerReason && (
                  <p className="verdict-card__winner-reason">{result.winnerReason}</p>
                )}
                <h4 className="verdict-card__title">Summary</h4>
                <p className="verdict-card__summary">{result.summary}</p>
                <div className="verdict-card__confidence">
                  <div className="verdict-card__confidence-bar">
                    <div
                      className="verdict-card__confidence-fill"
                      style={{ width: `${result.confidence || 0}%` }}
                    />
                  </div>
                  <span className="verdict-card__confidence-value">
                    {result.confidence || 0}%
                  </span>
                </div>
              </div>

              <button className="export-btn" onClick={handleExport}>
                <Download size={16} />
                Export
              </button>
            </div>

            {/* Item B Card */}
            <div className={`results__card results__card--b ${result.winner === result.items[1] ? 'results__card--winner' : ''}`}>
              {result.winner === result.items[1] && (
                <div className="winner-badge">
                  <Trophy size={14} />
                  WINNER
                </div>
              )}
              <h3 className="results__card-title">{result.items[1]}</h3>
              <div className="results__scores">
                {result.attributes.map((attr) => (
                  <div key={attr} className="results__score-row">
                    <span className="results__score-label">{attr}</span>
                    <span className="results__score-value">
                      {result.scores[result.items[1]]?.[attr] ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
              {result.pros?.[result.items[1]] && (
                <div className="results__pros">
                  <h4 className="results__pros-title">Pros</h4>
                  <ul className="results__pros-list">
                    {Object.values(result.pros[result.items[1]]).flat().slice(0, 5).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.cons?.[result.items[1]] && (
                <div className="results__cons">
                  <h4 className="results__cons-title">Cons</h4>
                  <ul className="results__cons-list">
                    {Object.values(result.cons[result.items[1]]).flat().slice(0, 5).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
