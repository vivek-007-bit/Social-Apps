import os
import sys
from pathlib import Path

# Ensure project root is on sys.path for serverless and local execution
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from a2wsgi import WSGIMiddleware
except ImportError:
    from starlette.middleware.wsgi import WSGIMiddleware

from app import flask_app
from app.api.fastapi_app import fastapi_app


class VercelPathMiddleware:
    """
    ASGI middleware for Vercel serverless execution.
    Restores the original requested URL path from Vercel rewrite headers
    (x-matched-path / x-forwarded-uri) before routing between FastAPI and Flask.
    """

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            headers = dict(scope.get("headers", []))
            
            # Vercel provides the original client request path in x-matched-path or x-forwarded-uri
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            if not matched_path:
                matched_path = headers.get(b"x-forwarded-uri", b"").decode("utf-8")

            if matched_path:
                # Strip query string if present in header
                clean_path = matched_path.split("?")[0]
                scope["path"] = clean_path
                scope["raw_path"] = clean_path.encode("utf-8")
            elif scope.get("path", "").startswith("/api/index.py"):
                rel_path = scope["path"][len("/api/index.py"):]
                scope["path"] = rel_path if rel_path.startswith("/") else ("/" + rel_path if rel_path else "/")
                scope["raw_path"] = scope["path"].encode("utf-8")
            elif scope.get("path", "").startswith("/api/index"):
                rel_path = scope["path"][len("/api/index"):]
                scope["path"] = rel_path if rel_path.startswith("/") else ("/" + rel_path if rel_path else "/")
                scope["raw_path"] = scope["path"].encode("utf-8")

        await self.asgi_app(scope, receive, send)


# Mount the Flask WSGI application onto the FastAPI ASGI application at root.
# FastAPI routes (/api/*) are matched first by ASGI; web and template routes fall through to Flask.
fastapi_app.mount("/", WSGIMiddleware(flask_app))

# Main serverless entry point wrapped with Vercel path resolution middleware
app = VercelPathMiddleware(fastapi_app)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 5000))
    print(f"Starting server on http://localhost:{port}")
    uvicorn.run("api.index:app", host="0.0.0.0", port=port, reload=True)
