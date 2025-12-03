import { useRef } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

type Props = {
  data: any
}

export default function RadarChart({ data }: Props) {
  const chartRef = useRef(null)

  if (!data) return null

  const parsed = data.result ?? data
  const items = parsed.items || []
  const attributes = parsed.attributes || []
  const scores = parsed.scores || {}

  if (items.length < 2 || attributes.length === 0) return null

  // Convert scores from { item: { attr: score } } to array format for Chart.js
  const getScoresArray = (item: string) => {
    const itemScores = scores[item]
    if (!itemScores) return []
    // If already an array, return it; otherwise extract values in attribute order
    if (Array.isArray(itemScores)) return itemScores
    return attributes.map((attr: string) => itemScores[attr] ?? 0)
  }

  const chartData = {
    labels: attributes,
    datasets: [
      {
        label: items[0],
        data: getScoresArray(items[0]),
        backgroundColor: 'rgba(126, 231, 255, 0.2)',
        borderColor: 'rgba(126, 231, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(126, 231, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(126, 231, 255, 1)'
      },
      {
        label: items[1],
        data: getScoresArray(items[1]),
        backgroundColor: 'rgba(255, 159, 252, 0.2)',
        borderColor: 'rgba(255, 159, 252, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 159, 252, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 159, 252, 1)'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: '#9aa4b2',
          font: {
            family: 'Syncopate, sans-serif',
            size: 10
          }
        },
        ticks: {
          color: '#666',
          backdropColor: 'transparent',
          stepSize: 20
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9aa4b2',
          font: {
            family: 'Syncopate, sans-serif',
            size: 11
          },
          padding: 20
        }
      }
    }
  }

  return (
    <div style={{ width: '100%', height: '320px' }}>
      <Radar ref={chartRef} data={chartData} options={options} />
    </div>
  )
}
