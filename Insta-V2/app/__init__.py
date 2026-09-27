import os
from flask import Flask
from app.database.mongodb import SECRET_KEY
from app.routes.web import web_bp


def create_app() -> Flask:
    """
    Application factory for the Flask web application.
    Configures templates, static files, and blueprints.
    """
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )

    app.config["SECRET_KEY"] = SECRET_KEY

    # Register blueprints
    app.register_blueprint(web_bp)

    return app


# Export default Flask app instance
flask_app = create_app()
