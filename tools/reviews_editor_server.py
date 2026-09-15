"""Local Reviews editor — approve/reject pending, rebuild reviews.html."""
import json
import os
import secrets
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

SITE = Path(__file__).resolve().parent.parent
PENDING_FILE = SITE / "data" / "reviews-pending.json"
APPROVED_FILE = SITE / "data" / "reviews-approved.json"
EDITOR_DIR = SITE / "customizer" / "reviews"
PORT = 8891

sys.path.insert(0, str(SITE / "tools"))
from build_reviews import build  # noqa: E402


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path):
    if not path.is_file():
        return {"reviews": []}
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return {"reviews": []}
    if not isinstance(data.get("reviews"), list):
        data["reviews"] = []
    return data


def save_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def find_by_id(reviews, review_id):
    for i, r in enumerate(reviews):
        if str(r.get("id")) == str(review_id):
            return i, r
    return None, None


def clean_review(payload, require_text=True):
    name = " ".join(str(payload.get("name") or "").split())
    service = " ".join(str(payload.get("service") or payload.get("hunt_type") or "").split())
    town = " ".join(str(payload.get("town") or payload.get("year") or "").split())
    text = str(payload.get("text") or "").strip()
    company = str(payload.get("company") or "").strip()
    try:
        rating = int(payload.get("rating") or 0)
    except (TypeError, ValueError):
        rating = 0
    if company:
        return None, "honeypot"
    if len(name) < 2 or len(name) > 80:
        return None, "Please enter a name (2–80 characters)."
    if require_text and (len(text) < 20 or len(text) > 2500):
        return None, "Please write a review between 20 and 2500 characters."
    if rating < 1 or rating > 5:
        return None, "Please choose a star rating from 1 to 5."
    if len(service) > 60:
        return None, "Service is too long."
    if len(town) > 40:
        return None, "Town is too long."
    return {
        "id": secrets.token_hex(8),
        "name": name,
        "service": service,
        "town": town,
        "rating": rating,
        "text": text,
        "submitted_at": now_iso(),
    }, None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def _cors(self):
        origin = self.headers.get("Origin") or ""
        if origin.startswith("http://127.0.0.1") or origin.startswith("http://localhost"):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/data":
            pending = load_json(PENDING_FILE)
            approved = load_json(APPROVED_FILE)
            return self._json(
                200,
                {
                    "ok": True,
                    "pending": pending.get("reviews", []),
                    "approved": approved.get("reviews", []),
                },
            )
        if path.startswith("/api/"):
            return self._json(404, {"ok": False, "error": "Not found"})
        rel = path.lstrip("/") or "index.html"
        file_path = (EDITOR_DIR / rel).resolve()
        if not str(file_path).startswith(str(EDITOR_DIR.resolve())) or not file_path.is_file():
            return self.send_error(404)
        content_type = "text/html"
        if rel.endswith(".js"):
            content_type = "application/javascript"
        elif rel.endswith(".css"):
            content_type = "text/css"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = self._read_json() if path.startswith("/api/") else {}
            if path in ("/api/submit", "/api/add-pending"):
                return self._add_pending(payload)
            if path == "/api/approve":
                return self._approve(payload)
            if path == "/api/reject":
                return self._reject(payload)
            if path == "/api/unapprove":
                return self._unapprove(payload)
            if path == "/api/delete-approved":
                return self._delete_approved(payload)
            if path == "/api/rebuild":
                out = build()
                return self._json(200, {"ok": True, "message": f"Rebuilt {out.name}"})
            if path == "/api/reorder-approved":
                return self._reorder(payload)
            return self._json(404, {"ok": False, "error": "Not found"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def _add_pending(self, payload):
        review, err = clean_review(payload)
        if err == "honeypot":
            return self._json(200, {"ok": True, "message": "Thank you! Your review was submitted and will appear after approval."})
        if err:
            return self._json(400, {"ok": False, "error": err})
        pending = load_json(PENDING_FILE)
        pending["reviews"].insert(0, review)
        save_json(PENDING_FILE, pending)
        return self._json(200, {"ok": True, "message": "Saved to pending. Approve it to show on the site."})

    def _approve(self, payload):
        review_id = payload.get("id")
        pending = load_json(PENDING_FILE)
        approved = load_json(APPROVED_FILE)
        idx, review = find_by_id(pending["reviews"], review_id)
        if review is None:
            return self._json(404, {"ok": False, "error": "Pending review not found"})
        pending["reviews"].pop(idx)
        review["approved_at"] = now_iso()
        approved["reviews"].insert(0, review)
        save_json(PENDING_FILE, pending)
        save_json(APPROVED_FILE, approved)
        build()
        return self._json(200, {"ok": True, "message": "Approved and reviews.html rebuilt."})

    def _reject(self, payload):
        review_id = payload.get("id")
        pending = load_json(PENDING_FILE)
        idx, review = find_by_id(pending["reviews"], review_id)
        if review is None:
            return self._json(404, {"ok": False, "error": "Pending review not found"})
        pending["reviews"].pop(idx)
        save_json(PENDING_FILE, pending)
        return self._json(200, {"ok": True, "message": "Rejected and removed from pending."})

    def _unapprove(self, payload):
        review_id = payload.get("id")
        pending = load_json(PENDING_FILE)
        approved = load_json(APPROVED_FILE)
        idx, review = find_by_id(approved["reviews"], review_id)
        if review is None:
            return self._json(404, {"ok": False, "error": "Approved review not found"})
        approved["reviews"].pop(idx)
        review.pop("approved_at", None)
        pending["reviews"].insert(0, review)
        save_json(PENDING_FILE, pending)
        save_json(APPROVED_FILE, approved)
        build()
        return self._json(200, {"ok": True, "message": "Moved back to pending; page rebuilt."})

    def _delete_approved(self, payload):
        review_id = payload.get("id")
        approved = load_json(APPROVED_FILE)
        idx, review = find_by_id(approved["reviews"], review_id)
        if review is None:
            return self._json(404, {"ok": False, "error": "Approved review not found"})
        approved["reviews"].pop(idx)
        save_json(APPROVED_FILE, approved)
        build()
        return self._json(200, {"ok": True, "message": "Deleted from approved; page rebuilt."})

    def _reorder(self, payload):
        ids = payload.get("ids") or []
        approved = load_json(APPROVED_FILE)
        by_id = {str(r.get("id")): r for r in approved["reviews"]}
        ordered = [by_id[i] for i in ids if i in by_id]
        leftovers = [r for r in approved["reviews"] if str(r.get("id")) not in set(ids)]
        approved["reviews"] = ordered + leftovers
        save_json(APPROVED_FILE, approved)
        build()
        return self._json(200, {"ok": True, "message": "Order saved; page rebuilt."})


def main():
    os.chdir(EDITOR_DIR)
    EDITOR_DIR.mkdir(parents=True, exist_ok=True)
    PENDING_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not PENDING_FILE.is_file():
        save_json(PENDING_FILE, {"reviews": []})
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Reviews Editor: http://127.0.0.1:{PORT}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
