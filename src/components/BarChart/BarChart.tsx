import { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Props = {
  data: {
    items: string[]
    attributes: string[]
    scores: Record<string, Record<string, number>>
  }
}

export default function BarChart({ data }: Props) {
  const chartRef = useRef(null)

  if (!data || !data.items || data.items.length < 2) return null

  const { items, attributes, scores } = data

  // Get scores arrays for each item
  const getScoresArray = (item: string) => {
    const itemScores = scores[item]
    if (!itemScores) return []
    if (Array.isArray(itemScores)) return itemScores
    return attributes.map((attr: string) => itemScores[attr] ?? 0)
  }

  const chartData = {
    labels: attributes,
    datasets: [
      {
        label: items[0],
        data: getScoresArray(items[0]),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 0,
        borderRadius: 6,
      },
      {
        label: items[1],
        data: getScoresArray(items[1]),
        backgroundColor: 'rgba(236, 72, 153, 0.6)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 0,
        borderRadius: 6,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.04)'
        },
        ticks: {
          color: '#8892a6',
          font: { size: 9 }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#8892a6',
          font: {
            family: 'Kumbh Sans, sans-serif',
            size: 10
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#8892a6',
          font: {
            family: 'Kumbh Sans, sans-serif',
            size: 9
          },
          padding: 12,
          boxWidth: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 12, 22, 0.9)',
        titleColor: '#fff',
        bodyColor: '#9aa4b2',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    }
  }

  return (
    <div className="bar-chart">
      <h4 className="bar-chart__title">Score Breakdown</h4>
      <div style={{ width: '100%', height: '200px' }}>
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  )
}
