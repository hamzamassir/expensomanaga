import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import { getCategoryMeta, formatMAD } from '../utils/constants'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
)

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } },
    },
  },
}

const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a78bfa', '#60a5fa', '#34d399', '#f472b6']

export function ExpenseDonut({ data }) {
  if (!data.length) {
    return <EmptyChart message="No expenses to chart yet." />
  }

  const chartData = {
    labels: data.map((d) => {
      const meta = getCategoryMeta(d.category)
      return `${meta.emoji} ${meta.label}`
    }),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: COLORS,
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  }

  return (
    <div className="h-64">
      <Doughnut
        data={chartData}
        options={{
          ...chartDefaults,
          plugins: {
            ...chartDefaults.plugins,
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${formatMAD(ctx.parsed)}`,
              },
            },
          },
        }}
      />
    </div>
  )
}

export function CashFlowBar({ data }) {
  if (!data.length) {
    return <EmptyChart message="No cash flow data for this period." />
  }

  const chartData = {
    labels: data.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Income',
        data: data.map((d) => d.income),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: data.map((d) => d.expense),
        backgroundColor: 'rgba(248, 113, 113, 0.7)',
        borderRadius: 6,
      },
    ],
  }

  return (
    <div className="h-64">
      <Bar
        data={chartData}
        options={{
          ...chartDefaults,
          scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#2a2a2a' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: '#2a2a2a' } },
          },
        }}
      />
    </div>
  )
}

export function NetTrendLine({ data }) {
  if (!data.length) {
    return <EmptyChart message="Add more transactions to see trends." />
  }

  let running = 0
  const cumulative = data.map((d) => {
    running += d.net
    return running
  })

  const chartData = {
    labels: data.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Cumulative Net',
        data: cumulative,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  }

  return (
    <div className="h-56">
      <Line
        data={chartData}
        options={{
          ...chartDefaults,
          plugins: { ...chartDefaults.plugins, legend: { display: false } },
          scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#2a2a2a' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: '#2a2a2a' } },
          },
        }}
      />
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
      {message}
    </div>
  )
}
