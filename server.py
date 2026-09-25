#!/usr/bin/env python3
"""Общая касса. Запуск: python3 server.py
Открыть: http://127.0.0.1:8080
"""
import json
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data.json")
DEFAULT = {
    "users": [],
    "cash": {"login": "kassa", "pass": "0000"},
    "days": {},
}


def read_state():
    if not os.path.exists(DATA):
        return DEFAULT.copy()
    with open(DATA, "r", encoding="utf-8") as f:
        s = json.load(f)
    s.setdefault("users", [])
    s.setdefault("cash", {"login": "kassa", "pass": "0000"})
    s.setdefault("days", {})
    return s


def write_state(s):
    tmp = DATA + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f, ensure_ascii=False)
    os.replace(tmp, DATA)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *args):
        print(self.address_string(), "-", fmt % args)

    def _json(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            return self._json(200, read_state())
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/api/state":
            self.send_error(404)
            return
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n).decode("utf-8") if n else "{}"
        try:
            s = json.loads(body)
        except json.JSONDecodeError:
            return self._json(400, {"error": "bad json"})
        s.setdefault("users", [])
        s.setdefault("cash", {"login": "kassa", "pass": "0000"})
        s.setdefault("days", {})
        write_state(s)
        return self._json(200, {"ok": True})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print("Касса: http://127.0.0.1:%s" % port)
    httpd.serve_forever()
