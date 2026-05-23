"""
RetailMind — TF-IDF Search Model Trainer (v2 — improved accuracy)

Key improvements over v1:
  - Name-only index for exact/phrase matching (primary signal)
  - Full-text index for semantic fallback
  - Hybrid scoring: 70% name match + 30% full-text
  - BM25-style sublinear TF with higher min_df cutoff suppressed
  - Stops "cable protector" from beating "hdmi cable"

Usage:  python -m ml.train_search_model
Output: trained_models/tfidf_search.pkl
"""

import sys, pickle, logging
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database.models import Product
from config import Config

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

# ── Weight constants ──────────────────────────────────────────────────────────
NAME_WEIGHT     = 0.70   # name match is the strongest signal
FULLTEXT_WEIGHT = 0.30   # description/category as soft context


def build_name_corpus(products: list[Product]) -> list[str]:
    """
    Name + brand + category only. No description noise.
    Repeat name 3x so exact-name matches dominate.
    """
    out = []
    for p in products:
        name     = (p.name     or "").strip()
        brand    = (p.brand    or "").strip()
        category = (p.category or "").strip()
        sub      = (p.sub_category or "").strip().replace("|", " ")
        out.append(f"{name} {name} {name} {brand} {category} {sub}")
    return out


def build_fulltext_corpus(products: list[Product]) -> list[str]:
    """
    Full text corpus: name + description + category.
    Description capped at 300 chars to limit noise.
    """
    out = []
    for p in products:
        name = (p.name        or "").strip()
        desc = (p.description or "")[:300].strip()
        cat  = (p.category    or "").strip()
        sub  = (p.sub_category or "").strip().replace("|", " ")
        out.append(f"{name} {cat} {sub} {desc}")
    return out


def fit_vectorizer(corpus: list[str], max_features: int = 40_000) -> tuple:
    vec = TfidfVectorizer(
        analyzer     = "word",
        ngram_range  = (1, 3),      # unigrams + bigrams + trigrams
        max_features = max_features,
        sublinear_tf = True,
        min_df       = 1,
        strip_accents= "unicode",
        lowercase    = True,
        token_pattern= r"(?u)\b\w\w+\b",
    )
    matrix = vec.fit_transform(corpus)
    return vec, normalize(matrix, norm="l2")


def train_search_model(output_path: Path = Config.SEARCH_MODEL_PATH) -> None:
    app = create_app()

    with app.app_context():
        products    = Product.query.all()
        product_ids = [p.id for p in products]

        if not products:
            log.error("❌ No products. Run seed_data.py first."); return

        log.info(f"📦 Building hybrid search index for {len(products)} products...")

        name_corpus     = build_name_corpus(products)
        fulltext_corpus = build_fulltext_corpus(products)

        log.info("🔢 Fitting name vectorizer...")
        name_vec, name_matrix = fit_vectorizer(name_corpus, max_features=30_000)

        log.info("🔢 Fitting full-text vectorizer...")
        ft_vec, ft_matrix = fit_vectorizer(fulltext_corpus, max_features=40_000)

        payload = {
            "name_vectorizer":     name_vec,
            "name_matrix":        name_matrix,
            "ft_vectorizer":      ft_vec,
            "ft_matrix":          ft_matrix,
            "product_ids":        product_ids,
            "name_weight":        NAME_WEIGHT,
            "fulltext_weight":    FULLTEXT_WEIGHT,
        }

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)

        log.info(f"✅ Hybrid search model saved → {output_path}")
        log.info(f"   Name vocab      : {len(name_vec.vocabulary_)}")
        log.info(f"   Full-text vocab : {len(ft_vec.vocabulary_)}")
        log.info(f"   Products indexed: {len(products)}")


if __name__ == "__main__":
    train_search_model()
