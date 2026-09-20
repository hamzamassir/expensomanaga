import {
  Car,
  ForkKnife,
  Gift,
  UsersThree,
  WifiHigh,
  Money,
  TrendUp,
  Wallet,
  Package,
  ArrowsLeftRight,
  Flag,
  Coffee,
  Bus,
} from '@phosphor-icons/react'
import { getCategoryMeta } from '../../utils/constants'

const PHOSPHOR_MAP = {
  Car,
  ForkKnife,
  Gift,
  UsersThree,
  WifiHigh,
  Money,
  TrendUp,
  Wallet,
  Package,
  ArrowsLeftRight,
  Flag,
  Coffee,
  Bus,
}

export default function CategoryIcon({
  categoryId,
  size = 20,
  weight = 'duotone',
  className = 'text-white/90',
}) {
  const meta = getCategoryMeta(categoryId)
  const Icon = PHOSPHOR_MAP[meta.phosphor] ?? Package
  return <Icon size={size} weight={weight} className={className} aria-hidden="true" />
}

export function PresetCategoryIcon({ categoryId, size = 14, className = 'text-income' }) {
  return <CategoryIcon categoryId={categoryId} size={size} className={className} weight="fill" />
}
