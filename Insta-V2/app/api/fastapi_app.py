from fastapi import FastAPI
from app.database.mongodb import check_mongodb_connection

# Initialize FastAPI application
fastapi_app = FastAPI(
    title="Insta-V2 API",
    description="API layer for Insta-V2 serverless application",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)


@fastapi_app.get("/api/health")
def health_check():
    """Basic API health endpoint."""
    return {"status": "ok"}


@fastapi_app.get("/api/health/db")
def database_health_check():
    """Database connectivity health endpoint."""
    return check_mongodb_connection()
