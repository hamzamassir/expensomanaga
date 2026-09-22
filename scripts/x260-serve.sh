#!/usr/bin/env bash
# Serve expensomanaga on X260: API + SQLite + static dist + Telegram bot
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${EXPENSO_PORT:-8766}"
VENV="$ROOT/.venv"
cd "$ROOT"

if [[ ! -d dist ]]; then
  echo "ERROR: dist/ missing. Build on Mac (npm run build), commit, push, then pull here." >&2
  exit 1
fi

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "Creating Python venv…"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -r "$ROOT/requirements.txt"
elif ! "$VENV/bin/python" -c "import telegram" 2>/dev/null; then
  echo "Installing Python dependencies…"
  "$VENV/bin/pip" install -r "$ROOT/requirements.txt"
fi

mkdir -p "${EXPENSO_DATA_DIR:-$ROOT/data}"

OLD_PID="$(ss -tlnp 2>/dev/null | awk -v p=":$PORT" '$4 ~ p { gsub(/.*pid=/, "", $6); gsub(/,.*/, "", $6); print $6; exit }' || true)"
if [[ -n "${OLD_PID:-}" ]]; then
  kill "$OLD_PID" 2>/dev/null || true
  sleep 1
fi
pkill -f "scripts/serve.py --host.*--port $PORT" 2>/dev/null || true
sleep 0.5

nohup "$VENV/bin/python" "$ROOT/scripts/serve.py" --host 0.0.0.0 --port "$PORT" \
  >/tmp/expensomanaga.log 2>&1 &

sleep 2
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:$PORT/" || true
curl -s "http://127.0.0.1:$PORT/api/health" || true
echo
echo "Expensomanaga → http://x260.tail07c06e.ts.net:$PORT/"
