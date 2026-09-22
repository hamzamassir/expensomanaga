# Expensomanaga

Personal expense manager — Vite + React + Tailwind frontend, Python backend with SQLite, Telegram quick-add bot.

## Quick start (dev)

Terminal 1 — backend (API on :8766):

```bash
pip3 install -r requirements.txt
python3 scripts/serve.py --api-only --port 8766
```

Terminal 2 — frontend:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (API proxied to backend).

## Telegram bot

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your user id from [@userinfobot](https://t.me/userinfobot)
3. Copy `.env.example` → `.env`:

```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_ALLOWED_USER_IDS=123456789
```

4. Restart the server. Flow:

```
/start → pick category → enter amount → ✅ Saved
```

## Deploy (X260 homelab)

```bash
npm run build
git push
# on X260:
git pull --ff-only
bash scripts/x260-serve.sh
```

Data lives in `data/expensomanaga.db` on the server (not in git).

## Features

- Multi-account dashboard (Main, Savings) with balances & net worth
- Transaction CRUD, transfers, CSV import/export
- Charts, financial goals, custom categories
- Quick expense (web + Telegram)
- PWA install on mobile

## Build

```bash
npm run build
python3 scripts/serve.py
```

Serves `dist/` + `/api/*` on port 8766.
