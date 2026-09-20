export default function RemixIcon({ name, className = '', ...props }) {
  return <i className={`${name} ${className}`} aria-hidden="true" {...props} />
}

export function AccountIcon({ accountId, className = 'text-lg leading-none' }) {
  const icons = {
    all: 'ri-pie-chart-2-line',
    main: 'ri-bank-line',
    savings: 'ri-safe-2-line',
  }
  return <RemixIcon name={icons[accountId] ?? 'ri-wallet-3-line'} className={className} />
}
