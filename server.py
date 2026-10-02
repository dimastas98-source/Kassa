#!/usr/bin/env python3
"""Общая касса. Запуск: python3 server.py
Открыть: http://127.0.0.1:8080

Хранение:
- если задан MONGO_URI — MongoDB (данные не слетают после деплоя)
- иначе — файл data.json (на Render стирается при редеплое)
"""
import json
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get("DATA_FILE") or os.path.join(ROOT, "data.json")
MONGO_URI = (os.environ.get("MONGO_URI") or "").strip()
MONGO_DB = os.environ.get("MONGO_DB") or "kassa"
MONGO_COL = os.environ.get("MONGO_COL") or "state"
DOC_ID = "main"

DEFAULT = {
    "users": [],
    "cash": {"login": "kassa", "pass": "0000"},
    "days": {},
}

_mongo = None


def _normalize(s):
    if not isinstance(s, dict):
        s = {}
    s.setdefault("users", [])
    s.setdefault("cash", {"login": "kassa", "pass": "0000"})
    s.setdefault("days", {})
    return s


def _mongo_col():
    global _mongo
    if not MONGO_URI:
        return None
    if _mongo is None:
        from pymongo import MongoClient

        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
        # проверка связи при первом обращении
        client.admin.command("ping")
        _mongo = client[MONGO_DB][MONGO_COL]
        print("MongoDB: ok, db=%s col=%s" % (MONGO_DB, MONGO_COL))
    return _mongo


def read_state():
    col = None
    try:
        col = _mongo_col()
    except Exception as e:
        print("MongoDB read error:", e)
        col = None

    if col is not None:
        try:
            doc = col.find_one({"_id": DOC_ID})
            if not doc:
                return _normalize(DEFAULT.copy())
            doc = dict(doc)
            doc.pop("_id", None)
            return _normalize(doc)
        except Exception as e:
            print("MongoDB find error:", e)
            return _normalize(DEFAULT.copy())

    if not os.path.exists(DATA):
        return _normalize(DEFAULT.copy())
    with open(DATA, "r", encoding="utf-8") as f:
        return _normalize(json.load(f))


def write_state(s):
    s = _normalize(s)
    col = None
    try:
        col = _mongo_col()
    except Exception as e:
        print("MongoDB write connect error:", e)
        col = None

    if col is not None:
        try:
            payload = dict(s)
            payload["_id"] = DOC_ID
            col.replace_one({"_id": DOC_ID}, payload, upsert=True)
            return
        except Exception as e:
            print("MongoDB write error:", e)
            # падаем в файл как запасной вариант

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
        if path == "/api/health":
            mode = "mongo" if MONGO_URI else "file"
            ok = True
            err = ""
            if MONGO_URI:
                try:
                    _mongo_col()
                except Exception as e:
                    ok = False
                    err = str(e)
            return self._json(200 if ok else 503, {"ok": ok, "storage": mode, "error": err})
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
        write_state(s)
        return self._json(200, {"ok": True})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    if MONGO_URI:
        print("Storage: MongoDB")
        try:
            _mongo_col()
        except Exception as e:
            print("MongoDB warning at start:", e)
    else:
        print("Storage: file", DATA)
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print("Касса: http://127.0.0.1:%s" % port)
    httpd.serve_forever()
