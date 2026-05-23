"""
RetailMind — Dataset Seeder (v4 — retailmind_master.csv compatible)
Clean CSV columns: product_name, category, sub_category, price,
                   rating, image_url, description

Usage:
    python -m database.seed_data
    python -m database.seed_data --limit 5000
"""
import sys, argparse
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database.db import db
from database.models import Product
from config import Config

BATCH_SIZE = 500

def seed_products(csv_path: Path, limit: int = None) -> int:
    print(f"📂  Reading: {csv_path}")
    df = pd.read_csv(csv_path, encoding="utf-8", on_bad_lines="skip", low_memory=False)
    if limit:
        df = df.head(limit)
    print(f"   Rows to import: {len(df):,}")

    Product.query.delete()
    db.session.commit()

    inserted, batch = 0, []

    for _, row in df.iterrows():
        name = str(row.get("product_name", "")).strip()[:500]
        if not name or name == "nan":
            continue

        # Price — already cleaned float in CSV
        try:    price = float(row.get("price", 0) or 0) or None
        except: price = None

        # Rating — already float
        try:    rating = float(row.get("rating", 0) or 0) or None
        except: rating = None

        # Image URL — already cleaned
        img = str(row.get("image_url", "")).strip()
        img = img if img and img not in ("nan", "-", "") else None

        p = Product(
            name         = name,
            category     = str(row.get("category", "")).strip()[:200] or None,
            sub_category = str(row.get("sub_category", "")).strip()[:400] or None,
            description  = str(row.get("description", "")).strip() or None,
            price        = price,
            actual_price = None,   # not in this CSV
            discount_pct = None,
            rating       = rating,
            review_count = 0,
            image_url    = img,
        )
        batch.append(p)

        if len(batch) >= BATCH_SIZE:
            db.session.bulk_save_objects(batch)
            db.session.commit()
            inserted += len(batch)
            print(f"   ✓ {inserted:,} rows inserted...")
            batch = []

    if batch:
        db.session.bulk_save_objects(batch)
        db.session.commit()
        inserted += len(batch)

    print(f"\n✅  Done — {inserted:,} products inserted.")
    return inserted


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv",   default=str(Config.PRODUCTS_CSV))
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        seed_products(Path(args.csv), args.limit)
