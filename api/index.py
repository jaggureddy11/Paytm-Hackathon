import sys
import os
from pathlib import Path

# Add project root and backend to sys.path
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Ensure VERCEL environment flag is detected
os.environ.setdefault("VERCEL", "1")

from server import app as fastapi_app

# ASGI Wrapper to ensure requests to /api or without /api both match FastAPI routes cleanly
class VercelFastApiApp:
    def __init__(self, inner_app):
        self.inner_app = inner_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            # If path arrives without /api prefix (e.g. from a rewrite), normalize to /api
            if not path.startswith("/api"):
                scope["path"] = "/api" + (path if path.startswith("/") else "/" + path)
        await self.inner_app(scope, receive, send)

app = VercelFastApiApp(fastapi_app)
