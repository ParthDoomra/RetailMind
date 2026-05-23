"""
RetailMind — Database Initialization
Single SQLAlchemy instance shared across the app.
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app: Flask) -> None:
    """Bind SQLAlchemy to the Flask app and create all tables."""
    app.config["SQLALCHEMY_DATABASE_URI"] = app.config["DATABASE_URI"]
    db.init_app(app)

    with app.app_context():
        # Import models so SQLAlchemy knows about them before create_all
        from database import models  # noqa: F401
        db.create_all()
