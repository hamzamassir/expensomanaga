#!/usr/bin/env bash
# Serve expensomanaga on X260 over Tailscale (port 8766, Python — no Node required)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${EXPENSO_PORT:-8766}"
cd "$ROOT"

if [[ ! -d dist ]]; then
  echo "ERROR: dist/ missing. Build on Mac (npm run build), commit, push, then pull here." >&2
  exit 1
fi

OLD_PID="$(ss -tlnp 2>/dev/null | awk -v p=":$PORT" '$4 ~ p { gsub(/.*pid=/, "", $6); gsub(/,.*/, "", $6); print $6; exit }' || true)"
if [[ -n "${OLD_PID:-}" ]]; then
  kill "$OLD_PID" 2>/dev/null || true
  sleep 1
fi

nohup python3 "$ROOT/scripts/static-server.py" --host 0.0.0.0 --port "$PORT" \
  >/tmp/expensomanaga.log 2>&1 &

sleep 1
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:$PORT/" || true
echo "Expensomanaga → http://x260.tail07c06e.ts.net:$PORT/"
