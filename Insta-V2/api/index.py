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

# Mount the Flask WSGI application onto the FastAPI ASGI application at root.
# FastAPI routes (/api/*) are matched first by ASGI; web and template routes fall through to Flask.
fastapi_app.mount("/", WSGIMiddleware(flask_app))

# Main serverless entry point exported for Vercel Python runtime
app = fastapi_app

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 5000))
    print(f"Starting server on http://localhost:{port}")
    uvicorn.run("api.index:app", host="0.0.0.0", port=port, reload=True)
