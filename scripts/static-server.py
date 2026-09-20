#!/usr/bin/env python3
"""Static file server for expensomanaga dist/ with SPA fallback."""
from __future__ import annotations

import argparse
import functools
import http.server
import os
import socketserver

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory or ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        local = os.path.join(ROOT, path.lstrip("/"))
        if path != "/" and not os.path.isfile(local):
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        print(fmt % args)


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()

    if not os.path.isdir(ROOT):
        raise SystemExit(f"Missing {ROOT} — run npm run build on Mac first.")

    handler = functools.partial(SpaHandler, directory=ROOT)
    with ReusableTCPServer((args.host, args.port), handler) as httpd:
        print(f"Serving {ROOT} on http://{args.host}:{args.port}/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
