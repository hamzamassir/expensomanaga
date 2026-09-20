import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { formatMAD } from '../utils/constants'
import { useCategoriesContext } from '../context/CategoriesContext'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } },
    },
  },
}

const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#94a3b8']

function EmptyChart({ message }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/15 text-sm text-muted">
      {message}
    </div>
  )
}

export function ExpenseDonut({ data }) {
  const { getMeta } = useCategoriesContext()

  if (!data.length) return <EmptyChart message="No expenses for this account yet." />

  const chartData = {
    labels: data.map((d) => getMeta(d.category).label),
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
    <div className="h-56">
      <Doughnut
        data={chartData}
        options={{
          ...chartDefaults,
          plugins: {
            ...chartDefaults.plugins,
            tooltip: { callbacks: { label: (ctx) => ` ${formatMAD(ctx.parsed)}` } },
          },
        }}
      />
    </div>
  )
}

export function TopCategoriesBar({ data }) {
  const { getMeta } = useCategoriesContext()
  const top = data.slice(0, 5)

  if (!top.length) return <EmptyChart message="No spending data yet." />

  const chartData = {
    labels: top.map((d) => getMeta(d.category).label),
    datasets: [
      {
        label: 'Spent',
        data: top.map((d) => d.total),
        backgroundColor: 'rgba(248, 113, 113, 0.75)',
        borderRadius: 8,
      },
    ],
  }

  return (
    <div className="h-56">
      <Bar
        data={chartData}
        options={{
          indexAxis: 'y',
          ...chartDefaults,
          plugins: {
            ...chartDefaults.plugins,
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${formatMAD(ctx.parsed.x)}` } },
          },
          scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#2a2a2a' } },
            y: { ticks: { color: '#9ca3af' }, grid: { display: false } },
          },
        }}
      />
    </div>
  )
}

export function MonthlyExpenseTrend({ data }) {
  if (!data.length) return <EmptyChart message="Add transactions to see monthly trends." />

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Expenses',
        data: data.map((d) => d.expenses),
        backgroundColor: 'rgba(248, 113, 113, 0.75)',
        borderRadius: 8,
      },
      {
        label: 'Income',
        data: data.map((d) => d.income),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderRadius: 8,
      },
    ],
  }

  return (
    <div className="h-56">
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

export function IncomeVsExpenseChart({ summary }) {
  const chartData = {
    labels: ['This month'],
    datasets: [
      {
        label: 'Income',
        data: [summary.income],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Expenses',
        data: [summary.expenses],
        backgroundColor: 'rgba(248, 113, 113, 0.8)',
        borderRadius: 8,
      },
    ],
  }

  return (
    <div className="h-56">
      <Bar
        data={chartData}
        options={{
          ...chartDefaults,
          scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: '#2a2a2a' } },
          },
        }}
      />
    </div>
  )
}
