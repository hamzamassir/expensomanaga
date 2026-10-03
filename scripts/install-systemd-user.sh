#!/usr/bin/env bash
# Install user systemd unit so Expensomanaga starts on boot (requires loginctl linger).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNIT_NAME=expensomanaga.service
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/$UNIT_NAME"

mkdir -p "$(dirname "$DEST")"
cp "$ROOT/scripts/$UNIT_NAME" "$DEST"

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Creating venv…"
  python3 -m venv "$ROOT/.venv"
  "$ROOT/.venv/bin/pip" install -r "$ROOT/requirements.txt"
fi

systemctl --user daemon-reload
systemctl --user enable --now "$UNIT_NAME"
systemctl --user status "$UNIT_NAME" --no-pager || true

echo
echo "Installed. Service survives reboot if user linger is on:"
loginctl show-user "$(whoami)" -p Linger 2>/dev/null || true
