#!/usr/bin/env python3
"""
Focus Budget — Servidor Local de Sincronización Wi-Fi (PC / Mac)
Permite respaldar y sincronizar tu base de datos de Focus Budget
directamente en tu red local de casa sin necesidad de internet ni servidores en la nube.
"""

import http.server
import socketserver
import json
import os
import socket
import ipaddress
from datetime import datetime
from pathlib import Path

PORT = 8000
MAX_PAYLOAD_BYTES = 10 * 1024 * 1024  # 10 MB límite máximo de seguridad
REQUIRED_CLIENT_HEADER = "FocusBudget-PWA"
BACKUP_DIR = Path(__file__).resolve().parent / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)
LATEST_BACKUP_PATH = BACKUP_DIR / "latest.json"


def get_local_ip():
    """Detects local LAN IP address (e.g. 192.168.1.XX)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def is_private_client_ip(ip_str: str) -> bool:
    """Allows only loopback or RFC1918 private local network IP addresses."""
    try:
        addr = ipaddress.ip_address(ip_str)
        return addr.is_loopback or addr.is_private
    except ValueError:
        return False


def is_allowed_origin(origin: str) -> bool:
    """Restricts browser CORS to local network origins or the official GitHub Pages PWA."""
    if not origin:
        return False
    allowed_prefixes = (
        "http://localhost",
        "https://localhost",
        "http://127.0.0.1",
        "https://127.0.0.1",
        "http://192.168.",
        "https://192.168.",
        "http://10.",
        "https://10.",
        "http://172.",
        "https://172.",
        "https://polgabrielli.github.io",
    )
    return origin.startswith(allowed_prefixes)


class SyncRequestHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        origin = self.headers.get("Origin", "")
        if is_allowed_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, X-Focus-Budget-Client",
        )

    def check_security_guards(self, require_client_header: bool = True) -> bool:
        client_ip = self.client_address[0]
        if not is_private_client_ip(client_ip):
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({"error": "Acceso permitido únicamente desde red local."}).encode("utf-8")
            )
            return False

        if require_client_header:
            client_token = self.headers.get("X-Focus-Budget-Client", "")
            if client_token != REQUIRED_CLIENT_HEADER:
                self.send_response(403)
                self.send_header("Content-Type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(
                    json.dumps({"error": "Cliente no autorizado."}).encode("utf-8")
                )
                return False

        return True

    def do_OPTIONS(self):
        if not self.check_security_guards(require_client_header=False):
            return
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/" or self.path == "/health":
            if not self.check_security_guards(require_client_header=False):
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.end_headers()

            backups = list(BACKUP_DIR.glob("backup_*.json"))
            res = {
                "status": "online",
                "app": "Focus Budget Sync Server",
                "totalBackups": len(backups),
                "hasLatest": LATEST_BACKUP_PATH.exists(),
                "serverTime": datetime.now().isoformat(),
            }
            self.wfile.write(json.dumps(res, indent=2).encode("utf-8"))

        elif self.path == "/api/backup/latest":
            if not self.check_security_guards(require_client_header=True):
                return
            if not LATEST_BACKUP_PATH.exists():
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(
                    json.dumps({"error": "No hay copias de seguridad aún"}).encode("utf-8")
                )
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            with open(LATEST_BACKUP_PATH, "rb") as f:
                self.wfile.write(f.read())

        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/backup":
            if not self.check_security_guards(require_client_header=True):
                return

            content_length = int(self.headers.get("Content-Length", 0))
            if content_length <= 0 or content_length > MAX_PAYLOAD_BYTES:
                self.send_response(413 if content_length > MAX_PAYLOAD_BYTES else 400)
                self.send_header("Content-Type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(
                    json.dumps({"error": "Tamaño de respaldo inválido o excede el límite de 10 MB."}).encode("utf-8")
                )
                return

            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("El payload debe ser un objeto JSON")

                for key in ("transactions", "categories", "commitments", "reminders"):
                    if key in payload and not isinstance(payload[key], list):
                        raise ValueError(f"El campo '{key}' debe ser una lista")

                now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_file = BACKUP_DIR / f"backup_{now_str}.json"

                # Save timestamped backup
                with open(backup_file, "w", encoding="utf-8") as f:
                    json.dump(payload, f, indent=2, ensure_ascii=False)

                # Update latest pointer
                with open(LATEST_BACKUP_PATH, "w", encoding="utf-8") as f:
                    json.dump(payload, f, indent=2, ensure_ascii=False)

                print(f"[✓] Backup guardado con éxito: {backup_file.name}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                res = {
                    "success": True,
                    "filename": backup_file.name,
                    "savedAt": datetime.now().isoformat(),
                    "items": {
                        "transactions": len(payload.get("transactions", [])),
                        "commitments": len(payload.get("commitments", [])),
                        "reminders": len(payload.get("reminders", [])),
                    },
                }
                self.wfile.write(json.dumps(res).encode("utf-8"))

            except Exception as e:
                print(f"[!] Error procesando backup: {e}")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(
                    json.dumps({"error": "Formato de respaldo inválido."}).encode("utf-8")
                )
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()


def run_server():
    local_ip = get_local_ip()
    print("=" * 65)
    print(" 🚀 FOCUS BUDGET — SERVIDOR LOCAL DE SINCRONIZACIÓN WI-FI")
    print("=" * 65)
    print(f" • Local en tu PC:     http://localhost:{PORT}")
    print(f" • Desde tu teléfono:  http://{local_ip}:{PORT}")
    print(f" • Carpeta de backups: {BACKUP_DIR}")
    print(" • Presiona Ctrl + C para detener el servidor")
    print("=" * 65)

    with socketserver.TCPServer(("0.0.0.0", PORT), SyncRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[✓] Servidor detenido de forma segura.")


if __name__ == "__main__":
    run_server()
