import json
from http.server import BaseHTTPRequestHandler, HTTPServer

RESULT = {
    "status": "completed",
    "pages": [{
        "page_number": 1,
        "text": "บริษัท ตัวอย่าง จำกัด",
        "lines": [{
            "text": "บริษัท ตัวอย่าง จำกัด",
            "confidence": 0.98,
            "bbox": [[10, 20], [300, 20], [300, 50], [10, 50]]
        }]
    }]
}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"status": "ok", "ocr_model_loaded": True})
            return
        if self.path == "/health/gpu":
            self.send_json(200, {"available": True, "device": "stub", "device_count": 1})
            return
        self.send_json(404, {"error": "not_found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length:
            self.rfile.read(length)
        if self.path == "/ocr":
            self.send_json(200, RESULT)
            return
        self.send_json(404, {"error": "not_found"})

    def send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_args):
        pass

HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
