# Expensomanaga

Lightning-fast personal expense manager — Vite + React + Tailwind, 100% client-side with localStorage.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Features

- Multi-account dashboard (Main, Savings, Cash) with live balances & net worth
- Transaction CRUD (Expense / Income / Transfer / Previous Balance)
- CSV import & export
- Category analytics with Chart.js donuts & cash-flow charts
- Quick-add presets, search/filter, mock AI screenshot import
- Seeded from `transactions.csv` on first load

## Build

```bash
npm run build
npm run preview
```

Static files land in `dist/` — serve with any static host or nginx.

## Data

All data stays in browser `localStorage`. Use **Data → Reset** to reload seed CSV.
