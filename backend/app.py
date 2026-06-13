"""
RetailMind — Flask Application Entry Point
"""

from flask import Flask
from flask_cors import CORS

# Load .env file automatically (ANTHROPIC_API_KEY etc.)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from config import Config
from database.db import init_db
from routes.search_routes import search_bp
from routes.product_routes import product_bp
from routes.analytics_routes import analytics_bp
from routes.recommendation_routes import recommendation_bp
from routes.image_routes import image_bp


def create_app(config: Config = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config or Config)

    # Allow all origins so frontend can always reach backend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    init_db(app)

    app.register_blueprint(search_bp,         url_prefix="/api")
    app.register_blueprint(product_bp,        url_prefix="/api")
    app.register_blueprint(analytics_bp,      url_prefix="/api")
    app.register_blueprint(recommendation_bp, url_prefix="/api")
    app.register_blueprint(image_bp,          url_prefix="/api")

    @app.get("/api/health")
    def health():
        import os
        has_key = bool(os.environ.get("ANTHROPIC_API_KEY", "").strip())
        return {
            "status":       "ok",
            "app":          "RetailMind",
            "claude_vision": "enabled" if has_key else "disabled (set ANTHROPIC_API_KEY)"
        }

    return app


import os

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)