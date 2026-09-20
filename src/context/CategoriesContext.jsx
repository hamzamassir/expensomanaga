import { createContext, useContext } from 'react'

export const CategoriesContext = createContext(null)

export function useCategoriesContext() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategoriesContext must be used within CategoriesProvider')
  return ctx
}
