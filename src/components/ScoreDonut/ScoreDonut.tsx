import { useMemo } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { TooltipItem } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

type Props = {
  data: {
    items: string[]
    attributes: string[]
    scores: Record<string, Record<string, number>>
  } | null
}

export default function ScoreDonut({ data }: Props) {
  // Calculate average scores
  const averages = useMemo(() => {
    if (!data || !data.items || data.items.length < 2) return [0, 0]
    const { items, scores } = data
    return items.map(item => {
      const itemScores = scores[item]
      if (!itemScores) return 0
      const values = Object.values(itemScores) as number[]
      return values.reduce((a, b) => a + b, 0) / values.length
    })
  }, [data])

  if (!data || !data.items || data.items.length < 2) return null

  const { items } = data
  const diff = Math.abs(averages[0] - averages[1])
  const leader = averages[0] > averages[1] ? items[0] : averages[1] > averages[0] ? items[1] : null

  const chartData = {
    labels: items,
    datasets: [
      {
        data: averages,
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(236, 72, 153, 0.7)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1.5,
        cutout: '55%',
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(10, 12, 22, 0.9)',
        titleColor: '#fff',
        bodyColor: '#9aa4b2',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            const value = context.raw as number
            return `${context.label}: ${value.toFixed(1)} avg`
          }
        }
      }
    }
  }

  return (
    <div className="score-donut">
      <h4 className="score-donut__title">Average Score</h4>
      <div className="score-donut__content">
        <div className="score-donut__chart">
          <Doughnut data={chartData} options={options} />
        </div>
        <div className="score-donut__stats">
          <div className="score-donut__item score-donut__item--a">
            <span className="score-donut__item-name">{items[0]}</span>
            <span className="score-donut__item-score">{averages[0].toFixed(1)}</span>
          </div>
          <div className="score-donut__diff">
            <span className="score-donut__diff-value">{diff.toFixed(0)}</span>
            <span className="score-donut__diff-label">pts {leader ? 'diff' : 'tie'}</span>
          </div>
          <div className="score-donut__item score-donut__item--b">
            <span className="score-donut__item-name">{items[1]}</span>
            <span className="score-donut__item-score">{averages[1].toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
