import os
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

# Load environment variables from .env file
load_dotenv()

# Configuration from environment variables
MONGODB_URI: Optional[str] = os.getenv("MONGODB_URI")
MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "instagram_db")
SECRET_KEY: str = os.getenv("SECRET_KEY", "default-dev-secret-key-change-in-production")

# Global client cache for serverless execution reuse
_mongo_client: Optional[MongoClient] = None


def mask_mongodb_uri(uri: Optional[str]) -> str:
    """Mask credentials in MongoDB connection string for safe logging."""
    if not uri:
        return "None"
    # Mask password in standard connection strings: mongodb+srv://user:password@host
    return re.sub(r":([^/@:]+)@", ":****@", uri)


def get_mongo_client() -> Optional[MongoClient]:
    """
    Get or create a cached MongoClient instance suitable for serverless execution.
    Reuses connection across warm serverless invocations.
    """
    global _mongo_client

    if _mongo_client is not None:
        return _mongo_client

    if not MONGODB_URI:
        return None

    try:
        # Initialize client with connection pooling appropriate for serverless
        _mongo_client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            maxPoolSize=10,
            minPoolSize=0,
            maxIdleTimeMS=30000,
        )
        return _mongo_client
    except PyMongoError as err:
        print(f"[MongoDB] Failed to initialize client: {err}")
        return None


def get_database(db_name: Optional[str] = None) -> Optional[Database]:
    """Retrieve the specified or default database instance."""
    client = get_mongo_client()
    if client is None:
        return None
    target_db = db_name or MONGODB_DATABASE
    return client[target_db]


def check_mongodb_connection() -> Dict[str, Any]:
    """
    Check the connectivity to MongoDB Atlas without exposing credentials.
    Returns a status dictionary suitable for health checks and diagnostics.
    """
    if not MONGODB_URI:
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "MONGODB_URI environment variable is not set.",
            "database": MONGODB_DATABASE,
        }

    client = get_mongo_client()
    if client is None:
        return {
            "status": "error",
            "connected": False,
            "message": "Failed to initialize MongoDB client.",
            "database": MONGODB_DATABASE,
        }

    try:
        # Ping the admin database to verify active connectivity
        client.admin.command("ping")
        return {
            "status": "connected",
            "connected": True,
            "message": "Successfully connected to MongoDB Atlas.",
            "database": MONGODB_DATABASE,
        }
    except ServerSelectionTimeoutError:
        return {
            "status": "error",
            "connected": False,
            "message": "Connection to MongoDB Atlas timed out. Check network or IP access list.",
            "database": MONGODB_DATABASE,
        }
    except PyMongoError as err:
        return {
            "status": "error",
            "connected": False,
            "message": f"MongoDB error: {str(err)}",
            "database": MONGODB_DATABASE,
        }
