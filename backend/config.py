"""
RetailMind — Configuration
All environment-specific settings live here.
Switch to PostgreSQL by changing DATABASE_URI.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent


class Config:
    # ── Database ──────────────────────────────────────────────────────────────
    # SQLite for development. Swap for PostgreSQL in production:
    # "postgresql://user:pass@localhost:5432/retailmind"
    DATABASE_URI: str = f"sqlite:///{BASE_DIR / 'retailmind.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── File uploads ──────────────────────────────────────────────────────────
    UPLOAD_FOLDER: Path = BASE_DIR / "uploads"
    MAX_CONTENT_LENGTH: int = 10 * 1024 * 1024  # 10 MB

    # ── Trained model paths ───────────────────────────────────────────────────
    MODELS_DIR: Path = ROOT_DIR / "trained_models"
    SEARCH_MODEL_PATH: Path = MODELS_DIR / "tfidf_search.pkl"
    RECOMMENDER_MODEL_PATH: Path = MODELS_DIR / "recommender.pkl"
    IMAGE_INDEX_PATH: Path = MODELS_DIR / "image_index.faiss"
    IMAGE_IDS_PATH: Path = MODELS_DIR / "image_ids.pkl"

    # ── Dataset paths ─────────────────────────────────────────────────────────
    DATASETS_DIR: Path = ROOT_DIR / "datasets"
    PRODUCTS_CSV: Path = DATASETS_DIR / "products.csv"

    # ── Recommendation settings ───────────────────────────────────────────────
    DEFAULT_RECOMMENDATION_COUNT: int = 8
    DEFAULT_SEARCH_RESULTS: int = 20

    # ── Image model ───────────────────────────────────────────────────────────
    IMAGE_FEATURE_DIM: int = 512   # ResNet18 output dim


# Create necessary directories on import
for _dir in [Config.UPLOAD_FOLDER, Config.MODELS_DIR, Config.DATASETS_DIR]:
    _dir.mkdir(parents=True, exist_ok=True)
