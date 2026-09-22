#!/usr/bin/env python3
"""Expensomanaga server: REST API + static SPA + optional Telegram bot."""
from __future__ import annotations

import argparse
import functools
import json
import logging
import os
import sys
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend import store  # noqa: E402

log = logging.getLogger(__name__)

try:
    from backend.telegram_bot import run_bot  # noqa: E402
except ImportError:
    def run_bot() -> None:  # type: ignore[misc]
        log.info("python-telegram-bot not installed — Telegram bot disabled")

API_PREFIX = "/api"


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: object) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


def _read_json(handler: BaseHTTPRequestHandler) -> object:
    length = int(handler.headers.get("Content-Length") or 0)
    if length <= 0:
        return None
    raw = handler.rfile.read(length)
    return json.loads(raw.decode("utf-8"))


def _api_route(path: str) -> tuple[str, str | None]:
    if not path.startswith(API_PREFIX):
        return "", None
    rest = path[len(API_PREFIX) :].strip("/")
    if not rest:
        return "health", None
    parts = rest.split("/")
    return parts[0], parts[1] if len(parts) > 1 else None


class ExpenseHandler(BaseHTTPRequestHandler):
    server_version = "Expensomanaga/2.0"

    def log_message(self, fmt: str, *args) -> None:
        log.info("%s - %s", self.address_string(), fmt % args)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        path = unquote(self.path.split("?", 1)[0])
        resource, item_id = _api_route(path)
        if resource:
            return self._handle_api_get(resource, item_id)
        return self._serve_static(path)

    def do_POST(self) -> None:
        path = unquote(self.path.split("?", 1)[0])
        resource, item_id = _api_route(path)
        if not resource:
            return self.send_error(HTTPStatus.NOT_FOUND)
        return self._handle_api_post(resource, item_id)

    def do_PUT(self) -> None:
        path = unquote(self.path.split("?", 1)[0])
        resource, item_id = _api_route(path)
        if not resource or not item_id:
            return self.send_error(HTTPStatus.NOT_FOUND)
        return self._handle_api_put(resource, item_id)

    def do_DELETE(self) -> None:
        path = unquote(self.path.split("?", 1)[0])
        resource, item_id = _api_route(path)
        if not resource or not item_id:
            return self.send_error(HTTPStatus.NOT_FOUND)
        return self._handle_api_delete(resource, item_id)

    def _handle_api_get(self, resource: str, item_id: str | None) -> None:
        if resource == "health":
            return _json_response(self, HTTPStatus.OK, {"ok": True})
        if resource == "transactions" and not item_id:
            return _json_response(self, HTTPStatus.OK, store.list_transactions())
        if resource == "settings" and not item_id:
            return _json_response(self, HTTPStatus.OK, store.get_settings())
        if resource == "goals" and not item_id:
            return _json_response(self, HTTPStatus.OK, store.list_goals())
        if resource == "categories" and not item_id:
            return _json_response(self, HTTPStatus.OK, store.list_custom_categories())
        self.send_error(HTTPStatus.NOT_FOUND)

    def _handle_api_post(self, resource: str, item_id: str | None) -> None:
        body = _read_json(self) or {}

        if resource == "reset":
            store.reset_all()
            return _json_response(
                self,
                HTTPStatus.OK,
                {
                    "transactions": store.list_transactions(),
                    "settings": store.get_settings(),
                    "goals": store.list_goals(),
                    "customCategories": store.list_custom_categories(),
                },
            )

        if resource == "migrate" and isinstance(body, dict):
            store.import_snapshot(body)
            return _json_response(
                self,
                HTTPStatus.OK,
                {
                    "transactions": store.list_transactions(),
                    "settings": store.get_settings(),
                    "goals": store.list_goals(),
                    "customCategories": store.list_custom_categories(),
                },
            )

        if resource == "transactions" and item_id == "bulk":
            mode = body.get("mode", "merge") if isinstance(body, dict) else "merge"
            items = body.get("items", []) if isinstance(body, dict) else []
            txs = store.bulk_import(items, mode)
            return _json_response(self, HTTPStatus.OK, txs)

        if resource == "transactions" and not item_id:
            tx = store.create_transaction(body if isinstance(body, dict) else {})
            return _json_response(self, HTTPStatus.CREATED, tx)

        if resource == "settings" and not item_id:
            settings = store.save_settings(body if isinstance(body, dict) else {})
            return _json_response(self, HTTPStatus.OK, settings)

        if resource == "goals" and not item_id:
            goal = store.create_goal(body if isinstance(body, dict) else {})
            return _json_response(self, HTTPStatus.CREATED, goal)

        if resource == "categories" and not item_id:
            cat = store.create_custom_category(body if isinstance(body, dict) else {})
            return _json_response(self, HTTPStatus.CREATED, cat)

        self.send_error(HTTPStatus.NOT_FOUND)

    def _handle_api_put(self, resource: str, item_id: str) -> None:
        body = _read_json(self) or {}
        if resource == "transactions":
            tx = store.update_transaction(item_id, body if isinstance(body, dict) else {})
            if not tx:
                return self.send_error(HTTPStatus.NOT_FOUND)
            return _json_response(self, HTTPStatus.OK, tx)
        if resource == "goals":
            goal = store.update_goal(item_id, body if isinstance(body, dict) else {})
            if not goal:
                return self.send_error(HTTPStatus.NOT_FOUND)
            return _json_response(self, HTTPStatus.OK, goal)
        self.send_error(HTTPStatus.NOT_FOUND)

    def _handle_api_delete(self, resource: str, item_id: str) -> None:
        ok = False
        if resource == "transactions":
            ok = store.delete_transaction(item_id)
        elif resource == "goals":
            ok = store.delete_goal(item_id)
        elif resource == "categories":
            ok = store.delete_custom_category(item_id)
        if not ok:
            return self.send_error(HTTPStatus.NOT_FOUND)
        return _json_response(self, HTTPStatus.OK, {"ok": True})

    def _serve_static(self, path: str) -> None:
        if path == "/":
            path = "/index.html"
        local = os.path.join(ROOT, path.lstrip("/"))
        if path != "/index.html" and not os.path.isfile(local):
            local = os.path.join(ROOT, "index.html")
        if not os.path.isfile(local):
            return self.send_error(HTTPStatus.NOT_FOUND)

        mime = "application/octet-stream"
        if local.endswith(".html"):
            mime = "text/html; charset=utf-8"
        elif local.endswith(".js"):
            mime = "application/javascript; charset=utf-8"
        elif local.endswith(".css"):
            mime = "text/css; charset=utf-8"
        elif local.endswith(".json") or local.endswith(".webmanifest"):
            mime = "application/json; charset=utf-8"
        elif local.endswith(".svg"):
            mime = "image/svg+xml"
        elif local.endswith(".woff2"):
            mime = "font/woff2"

        with open(local, "rb") as fh:
            data = fh.read()

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        if local.endswith(".html"):
            self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)


def _load_dotenv() -> None:
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if not os.path.isfile(env_path):
        return
    with open(env_path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=int(os.environ.get("EXPENSO_PORT", "8766")))
    parser.add_argument("--no-bot", action="store_true")
    parser.add_argument("--api-only", action="store_true", help="API only (no static files)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    _load_dotenv()

    store.init_db()

    if args.api_only:
        global ROOT
        ROOT = ""

    if not args.api_only and not os.path.isdir(os.path.join(os.path.dirname(__file__), "..", "dist")):
        log.warning("dist/ missing — run npm run build on Mac first")

    handler = ExpenseHandler
    httpd = ThreadingHTTPServer((args.host, args.port), handler)
    log.info("Expensomanaga API + static on http://%s:%s/", args.host, args.port)

    use_bot = not args.no_bot and bool(os.environ.get("TELEGRAM_BOT_TOKEN", "").strip())
    if use_bot:
        threading.Thread(target=httpd.serve_forever, daemon=True, name="http-server").start()
        run_bot()
    else:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
