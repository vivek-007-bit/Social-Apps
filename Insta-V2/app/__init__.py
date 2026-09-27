import os
from pathlib import Path
from flask import Flask
from app.database.mongodb import SECRET_KEY
from app.routes.web import web_bp

BASE_DIR = Path(__file__).resolve().parent


def create_app() -> Flask:
    """
    Application factory for the Flask web application.
    Configures templates, static files, and blueprints with absolute paths.
    """
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "templates"),
        static_folder=str(BASE_DIR / "static"),
    )

    app.config["SECRET_KEY"] = SECRET_KEY

    # Register blueprints
    app.register_blueprint(web_bp)

    return app


# Export default Flask app instance
flask_app = create_app()
