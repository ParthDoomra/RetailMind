"""
RetailMind — Product Search Service (v3 — exact name boost)

Scoring pipeline:
  1. Name-TF-IDF score  (weight 0.65)
  2. Full-text score    (weight 0.25)
  3. Exact-phrase bonus (weight 0.10) — if query words all appear in product name
  4. Rating bonus       (tiny)        — tiebreak toward better-rated products
"""

import pickle, logging, re
from pathlib import Path

import numpy as np
from sklearn.preprocessing import normalize

from config import Config

log    = logging.getLogger(__name__)
_model = None


def _load() -> dict | None:
    global _model
    if _model: return _model
    p = Config.SEARCH_MODEL_PATH
    if not p.exists():
        log.warning("Search model not found. Run: python -m ml.train_search_model")
        return None
    with open(p, "rb") as f:
        _model = pickle.load(f)
    log.info(f"Search model loaded — {len(_model['product_ids'])} products")
    return _model


def _exact_phrase_bonus(query_tokens: list[str], names: list[str]) -> np.ndarray:
    """
    Binary bonus: 1.0 if ALL query tokens appear in product name (case-insensitive).
    Helps "phone charger" rank actual chargers above accessories that mention charger.
    """
    bonus = np.zeros(len(names), dtype=np.float32)
    for i, name in enumerate(names):
        name_lower = name.lower()
        if all(t in name_lower for t in query_tokens):
            bonus[i] = 1.0
    return bonus


def _rating_bonus(ratings: list[float | None]) -> np.ndarray:
    """Tiny normalised rating signal — only affects close ties."""
    arr = np.array([r if r else 3.0 for r in ratings], dtype=np.float32)
    arr = (arr - arr.min()) / (arr.max() - arr.min() + 1e-9)
    return arr * 0.02   # max 0.02 boost — just a tiebreaker


def search_products(
    query: str,
    top_n: int = Config.DEFAULT_SEARCH_RESULTS,
    product_names: list[str] | None = None,
    product_ratings: list[float | None] | None = None,
) -> list[dict]:
    """
    Hybrid search. Returns [{"product_id": int, "score": float}].
    Pass product_names and product_ratings for the best accuracy.
    """
    m = _load()
    if not m: return []

    ids = m["product_ids"]

    # ── TF-IDF scores ──────────────────────────────────────────────────────
    qv_name = normalize(m["name_vectorizer"].transform([query]), norm="l2")
    s_name  = (m["name_matrix"] @ qv_name.T).toarray().flatten()

    qv_ft   = normalize(m["ft_vectorizer"].transform([query]), norm="l2")
    s_ft    = (m["ft_matrix"] @ qv_ft.T).toarray().flatten()

    combined = 0.65 * s_name + 0.25 * s_ft

    # ── Exact phrase bonus ─────────────────────────────────────────────────
    if product_names:
        tokens  = re.findall(r'\w+', query.lower())
        bonus   = _exact_phrase_bonus(tokens, product_names)
        combined = combined + 0.10 * bonus

    # ── Rating tiebreaker ──────────────────────────────────────────────────
    if product_ratings:
        combined = combined + _rating_bonus(product_ratings)

    top_idx = np.argsort(combined)[::-1][:top_n]

    return [
        {"product_id": ids[i], "score": round(float(combined[i]), 4)}
        for i in top_idx
        if combined[i] > 0.01
    ]


def reload():
    global _model
    _model = None
    _load()


def search_products_smart(
    query: str,
    top_n: int = Config.DEFAULT_SEARCH_RESULTS,
) -> list[dict]:
    """
    Smart search with name-first fallback.
    If the top name-only results have score > 0.15, return those directly
    (avoids description-noise pollution). Otherwise fall back to full hybrid.
    """
    m = _load()
    if not m: return []

    ids = m["product_ids"]

    # Pure name match first
    qv_name  = normalize(m["name_vectorizer"].transform([query]), norm="l2")
    s_name   = (m["name_matrix"] @ qv_name.T).toarray().flatten()

    name_top = np.argsort(s_name)[::-1][:top_n]
    name_top_scores = s_name[name_top]

    # If name model is confident enough, use it predominantly
    name_confidence = float(name_top_scores[0]) if len(name_top_scores) else 0

    if name_confidence >= 0.15:
        # High-confidence name match: 80% name, 20% fulltext
        nw, fw = 0.80, 0.20
    else:
        # Low confidence: fall back to balanced hybrid
        nw, fw = 0.60, 0.40

    qv_ft  = normalize(m["ft_vectorizer"].transform([query]), norm="l2")
    s_ft   = (m["ft_matrix"] @ qv_ft.T).toarray().flatten()

    combined = nw * s_name + fw * s_ft

    # Fetch top candidates to apply exact name & rating bonuses without loading the whole DB
    fetch_n = max(top_n * 5, 200) # fetch enough to re-rank
    candidate_idx = np.argsort(combined)[::-1][:fetch_n]
    
    # Filter candidates with very low initial scores
    candidate_idx = [i for i in candidate_idx if combined[i] > 0.01]
    
    if not candidate_idx:
        return []

    candidate_ids = [int(ids[i]) for i in candidate_idx]
    
    # Lazy load to avoid circular import issues
    from database.db import db
    from database.models import Product
    
    products = db.session.query(Product).filter(Product.id.in_(candidate_ids)).all()
    prod_dict = {p.id: p for p in products}

    tokens = re.findall(r'\w+', query.lower())
    
    results = []
    for i in candidate_idx:
        pid = int(ids[i])
        score = float(combined[i])
        p = prod_dict.get(pid)
        
        if p:
            name_lower = (p.name or "").lower()
            if all(t in name_lower for t in tokens):
                score += 0.12
                
            rating = p.rating or 3.0
            score += (rating / 5.0) * 0.015
            
            results.append({"product_id": pid, "score": score})

    # Sort again by updated scores
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return [
        {"product_id": r["product_id"], "score": round(r["score"], 4)}
        for r in results[:top_n]
    ]

