const API = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

function readLocal(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function clearLocalStorage() {
  for (const key of [
    'expensomanaga_transactions',
    'expensomanaga_initialized',
    'expensomanaga_mig_interest_savings',
    'expensomanaga_mig_no_cash',
    'expensomanaga_settings',
    'expensomanaga_goals',
    'expensomanaga_custom_categories',
  ]) {
    localStorage.removeItem(key)
  }
}

export async function checkHealth() {
  return request('/health')
}

export async function getTransactions() {
  return request('/transactions')
}

export async function createTransaction(partial) {
  return request('/transactions', { method: 'POST', body: JSON.stringify(partial) })
}

export async function updateTransaction(id, updates) {
  return request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
}

export async function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: 'DELETE' })
}

export async function bulkImportTransactions(items, mode = 'merge') {
  return request('/transactions/bulk', {
    method: 'POST',
    body: JSON.stringify({ items, mode }),
  })
}

export async function getSettings() {
  return request('/settings')
}

export async function saveSettings(patch) {
  return request('/settings', { method: 'POST', body: JSON.stringify(patch) })
}

export async function getGoals() {
  return request('/goals')
}

export async function createGoal(partial) {
  return request('/goals', { method: 'POST', body: JSON.stringify(partial) })
}

export async function updateGoal(id, updates) {
  return request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
}

export async function deleteGoal(id) {
  return request(`/goals/${id}`, { method: 'DELETE' })
}

export async function getCustomCategories() {
  return request('/categories')
}

export async function createCustomCategory(partial) {
  return request('/categories', { method: 'POST', body: JSON.stringify(partial) })
}

export async function deleteCustomCategory(id) {
  return request(`/categories/${id}`, { method: 'DELETE' })
}

export async function resetAllData() {
  return request('/reset', { method: 'POST', body: '{}' })
}

/** One-time move from browser localStorage to server DB. */
export async function migrateLocalStorageIfNeeded(serverTransactions) {
  const localTx = readLocal('expensomanaga_transactions', [])
  const localGoals = readLocal('expensomanaga_goals', [])
  const localSettings = readLocal('expensomanaga_settings', null)
  const localCategories = readLocal('expensomanaga_custom_categories', [])

  const hasLocal =
    localTx.length > 0 ||
    localGoals.length > 0 ||
    localCategories.length > 0 ||
    (localSettings && Object.keys(localSettings).length > 0)

  if (!hasLocal) return serverTransactions

  const snapshot = await request('/migrate', {
    method: 'POST',
    body: JSON.stringify({
      transactions: localTx,
      goals: localGoals,
      settings: localSettings ?? undefined,
      customCategories: localCategories,
    }),
  })

  clearLocalStorage()
  return snapshot.transactions
}

export async function loadAppData() {
  await checkHealth()
  let transactions = await getTransactions()
  transactions = await migrateLocalStorageIfNeeded(transactions)
  const [settings, goals, customCategories] = await Promise.all([
    getSettings(),
    getGoals(),
    getCustomCategories(),
  ])
  return { transactions, settings, goals, customCategories }
}
