import { useCallback, useState } from 'react'
import { roundMoney, parseMoneyInput } from '../utils/money'

const GOALS_KEY = 'expensomanaga_goals'

export const GOAL_TRACKERS = [
  { id: 'savings', label: 'Savings balance' },
  { id: 'net_worth', label: 'Net worth' },
  { id: 'monthly_net', label: 'Monthly net savings' },
  { id: 'manual', label: 'Manual progress' },
]

function loadGoals() {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return []
}

function saveGoals(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

export function computeGoalProgress(goal, { balances, netWorth, monthSummary }) {
  let current = 0
  if (goal.track === 'savings') current = Math.max(0, balances.savings ?? 0)
  else if (goal.track === 'net_worth') current = Math.max(0, netWorth ?? 0)
  else if (goal.track === 'monthly_net') current = Math.max(0, monthSummary?.net ?? 0)
  else current = Math.max(0, roundMoney(goal.savedAmount ?? 0))

  const target = roundMoney(goal.target) || 1
  current = roundMoney(current)
  const pct = Math.min(100, (current / target) * 100)
  return {
    current,
    pct,
    remaining: roundMoney(Math.max(0, target - current)),
    complete: current >= target,
  }
}

export function useGoals() {
  const [goals, setGoals] = useState(() => loadGoals())

  const persist = useCallback((next) => {
    setGoals(next)
    saveGoals(next)
  }, [])

  const addGoal = useCallback(
    (partial) => {
      const goal = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        name: partial.name,
        target: roundMoney(partial.target),
        track: partial.track ?? 'savings',
        deadline: partial.deadline || null,
        savedAmount: roundMoney(partial.savedAmount ?? 0),
        createdAt: new Date().toISOString().slice(0, 10),
      }
      persist([goal, ...goals])
      return goal
    },
    [goals, persist],
  )

  const updateGoal = useCallback(
    (id, updates) => {
      const next = { ...updates }
      if ('target' in next) next.target = roundMoney(next.target)
      if ('savedAmount' in next) next.savedAmount = roundMoney(next.savedAmount)
      persist(goals.map((g) => (g.id === id ? { ...g, ...next } : g)))
    },
    [goals, persist],
  )

  const deleteGoal = useCallback(
    (id) => {
      persist(goals.filter((g) => g.id !== id))
    },
    [goals, persist],
  )

  return { goals, addGoal, updateGoal, deleteGoal, parseMoneyInput }
}
