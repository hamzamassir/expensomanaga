export function roundMoney(n) {
  const num = Number(n)
  if (Number.isNaN(num)) return 0
  return Math.round(num * 100) / 100
}

export function parseMoneyInput(value) {
  if (value === '' || value == null) return null
  const cleaned = String(value).trim().replace(',', '.')
  const num = Number(cleaned)
  if (Number.isNaN(num)) return null
  return roundMoney(num)
}
