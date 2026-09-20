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
  House,
  Barbell,
  Heart,
  GraduationCap,
  FilmStrip,
  ShoppingCart,
  TShirt,
  GameController,
  Airplane,
  Book,
  PiggyBank,
  FirstAid,
  Dog,
} from '@phosphor-icons/react'
import { useCategoriesContext } from '../../context/CategoriesContext'

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
  House,
  Barbell,
  Heart,
  GraduationCap,
  FilmStrip,
  ShoppingCart,
  TShirt,
  GameController,
  Airplane,
  Book,
  PiggyBank,
  FirstAid,
  Dog,
}

export function PhosphorGlyph({ name, size = 20, weight = 'duotone', className = 'text-white/90' }) {
  const Icon = PHOSPHOR_MAP[name] ?? Package
  return <Icon size={size} weight={weight} className={className} aria-hidden="true" />
}

export default function CategoryIcon({
  categoryId,
  size = 20,
  weight = 'duotone',
  className = 'text-white/90',
}) {
  const { getMeta } = useCategoriesContext()
  const meta = getMeta(categoryId)
  return <PhosphorGlyph name={meta.phosphor} size={size} weight={weight} className={className} />
}

export function PresetCategoryIcon({ categoryId, size = 14, className = 'text-income' }) {
  return <CategoryIcon categoryId={categoryId} size={size} className={className} weight="fill" />
}

export { PHOSPHOR_MAP }
