"""Servidor local de desarrollo para Herramientas M&E (puerto 5500).
Sirve los archivos estáticos igual que `python -m http.server 5500` y además
habilita `/api/check?url=...` para verificar enlaces de KoboToolbox en tiempo real.

Uso:
    python dev_server.py
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
import json
import re
import time
import urllib.error
import urllib.request

PORT = 5500
ALLOWED_ORIGIN = "https://kf.kobo.iom.int"
ALLOWED_PATH_RE = re.compile(r"^/api/v2/assets/[^/]+/export-settings/[^/]+/data\.(csv|xlsx)$", re.I)
TIMEOUT_SEC = 20


class DevHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/check":
            self.handle_api_check(parsed)
            return
        super().do_GET()

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_api_check(self, parsed):
        qs = parse_qs(parsed.query)
        raw_url = (qs.get("url") or [""])[0]
        target = urlparse(raw_url)
        origin = f"{target.scheme}://{target.netloc}"

        if origin != ALLOWED_ORIGIN or not ALLOWED_PATH_RE.match(target.path):
            self.send_json({"ok": False, "error": "Solo se permiten enlaces de exportación de KoboToolbox"}, 403)
            return

        t0 = time.monotonic()
        req = urllib.request.Request(raw_url, headers={"Accept": "*/*", "User-Agent": "Herramientas-ME-Check/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
                status = resp.status
                content_type = resp.headers.get("Content-Type", "")
                raw_len = resp.headers.get("Content-Length")
                content_length = int(raw_len) if raw_len and raw_len.isdigit() else None
                chunk = resp.read(1024)
                sample_bytes = len(chunk) if chunk else 0
                elapsed_ms = int((time.monotonic() - t0) * 1000)
                self.send_json({
                    "ok": 200 <= status < 300 and sample_bytes > 0,
                    "status": status,
                    "statusText": getattr(resp, "reason", "OK"),
                    "contentType": content_type,
                    "contentLength": content_length,
                    "sampleBytes": sample_bytes,
                    "elapsedMs": elapsed_ms,
                })
        except urllib.error.HTTPError as err:
            elapsed_ms = int((time.monotonic() - t0) * 1000)
            self.send_json({
                "ok": False,
                "timedOut": err.code == 504,
                "status": err.code,
                "statusText": str(err.reason or ""),
                "error": f"HTTP {err.code} {err.reason}",
                "elapsedMs": elapsed_ms,
            })
        except Exception as err:
            elapsed_ms = int((time.monotonic() - t0) * 1000)
            msg = str(err)
            timed_out = "timed out" in msg.lower()
            self.send_json({
                "ok": False,
                "timedOut": timed_out,
                "status": 504 if timed_out else 502,
                "error": "Tiempo de espera agotado (>20s)" if timed_out else msg,
                "elapsedMs": elapsed_ms,
            })


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), DevHandler)
    print(f"Servidor local con proxy /api/check activo en http://127.0.0.1:{PORT}")
    server.serve_forever()
