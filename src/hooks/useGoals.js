import { useCallback, useEffect, useState } from 'react'
import * as api from '../utils/api'
import { roundMoney, parseMoneyInput } from '../utils/money'

export const GOAL_TRACKERS = [
  { id: 'savings', label: 'Savings balance' },
  { id: 'net_worth', label: 'Net worth' },
  { id: 'monthly_net', label: 'Monthly net savings' },
  { id: 'manual', label: 'Manual progress' },
]

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
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getGoals()
        if (!cancelled) setGoals(data)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const addGoal = useCallback(async (partial) => {
    const goal = await api.createGoal({
      name: partial.name,
      target: roundMoney(partial.target),
      track: partial.track ?? 'savings',
      deadline: partial.deadline || null,
      savedAmount: roundMoney(partial.savedAmount ?? 0),
      createdAt: new Date().toISOString().slice(0, 10),
    })
    setGoals((prev) => [goal, ...prev])
    return goal
  }, [])

  const updateGoal = useCallback(async (id, updates) => {
    const next = { ...updates }
    if ('target' in next) next.target = roundMoney(next.target)
    if ('savedAmount' in next) next.savedAmount = roundMoney(next.savedAmount)
    const goal = await api.updateGoal(id, next)
    setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)))
    return goal
  }, [])

  const deleteGoal = useCallback(async (id) => {
    await api.deleteGoal(id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  return { goals, addGoal, updateGoal, deleteGoal, parseMoneyInput, loading }
}
