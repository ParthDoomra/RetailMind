"""
RetailMind — Recommendation Model Trainer (v3 — large-dataset safe)

Key changes vs v2:
  - NEVER calls .toarray() — stays sparse throughout
  - Uses scipy sparse matrix for dot-product similarity at query time
  - Handles 200k+ products on a normal laptop (8 GB RAM)
  - Saves the sparse matrix directly with scipy.sparse.save_npz

Usage:  python -m ml.train_recommendation_model
Output: trained_models/recommender.pkl
        trained_models/recommender_matrix.npz
"""

import sys, pickle, logging
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database.models import Product
from config import Config

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

MATRIX_PATH = Config.MODELS_DIR / "recommender_matrix.npz"


def build_corpus(products: list[Product]) -> tuple[list[str], list[int]]:
    """Build weighted text per product. Name repeated 4x = strongest signal."""
    corpus, ids = [], []
    for p in products:
        name  = (p.name         or "").strip()
        cat   = (p.category     or "").strip()
        sub   = (p.sub_category or "").strip().replace("|", " ")
        desc  = (p.description  or "")[:300].strip()
        corpus.append(f"{name} {name} {name} {name} {cat} {cat} {sub} {desc}")
        ids.append(p.id)
    return corpus, ids


def train_recommendation_model(output_path: Path = Config.RECOMMENDER_MODEL_PATH) -> None:
    app = create_app()

    with app.app_context():
        log.info("📋 Loading products from database...")
        products = Product.query.all()

        if not products:
            log.error("❌ No products. Run seed_data.py first."); return

        log.info(f"📦 Building recommendation index for {len(products)} products...")

        corpus, product_ids = build_corpus(products)

        vectorizer = TfidfVectorizer(
            analyzer     = "word",
            ngram_range  = (1, 2),
            max_features = 30_000,     # keep vocab small for memory
            sublinear_tf = True,
            min_df       = 2,          # ignore ultra-rare terms
            strip_accents = "unicode",
            lowercase    = True,
            dtype        = np.float32, # float32 saves ~50% RAM vs float64
        )

        log.info("🔢 Fitting TF-IDF vectorizer on product corpus...")
        # Returns a sparse matrix — NO .toarray() call anywhere
        sparse_matrix = vectorizer.fit_transform(corpus)
        log.info(f"   Vocabulary size : {len(vectorizer.vocabulary_)}")
        log.info(f"   Matrix shape    : {sparse_matrix.shape}")
        log.info(f"   Non-zero entries: {sparse_matrix.nnz:,}")

        # L2-normalize rows (still sparse)
        log.info("🔧 Normalizing sparse matrix...")
        sparse_normalized = normalize(sparse_matrix, norm="l2")

        # Save the sparse matrix separately (much more memory-efficient than pickle)
        MATRIX_PATH.parent.mkdir(parents=True, exist_ok=True)
        sp.save_npz(str(MATRIX_PATH), sparse_normalized.astype(np.float32))
        log.info(f"   Sparse matrix saved → {MATRIX_PATH}")

        # Save metadata (vectorizer + ids) in the main pkl
        payload = {
            "vectorizer":   vectorizer,
            "product_ids":  product_ids,
            "matrix_filename": MATRIX_PATH.name,  # Store only the filename so it's portable
            "method":       "sparse_tfidf_cosine",
            "n_products":   len(products),
        }

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)

        log.info(f"✅ Recommender model saved → {output_path}")
        log.info(f"   Products indexed  : {len(products):,}")
        log.info(f"   Method            : Sparse TF-IDF + Cosine similarity (memory-safe)")
        log.info(f"   RAM used by matrix: ~{sparse_normalized.data.nbytes / 1e6:.0f} MB")


if __name__ == "__main__":
    train_recommendation_model()
