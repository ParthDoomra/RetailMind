"""
RetailMind — SQLAlchemy Models
Fields match the retailmind_master.csv columns.
"""
from datetime import datetime
from database.db import db


def _clean(val) -> str | None:
    """Return None for null-ish values including the string 'nan'."""
    if val is None: return None
    s = str(val).strip()
    return None if s in ('', 'nan', 'NaN', 'none', 'None', 'NULL') else s


class Product(db.Model):
    __tablename__ = "products"

    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(500), nullable=False, index=True)
    category     = db.Column(db.String(200), index=True)
    sub_category = db.Column(db.String(400))
    brand        = db.Column(db.String(200))
    description  = db.Column(db.Text)
    price        = db.Column(db.Float)
    actual_price = db.Column(db.Float)
    discount_pct = db.Column(db.Float)
    rating       = db.Column(db.Float)
    review_count = db.Column(db.Integer, default=0)
    image_url    = db.Column(db.String(1000))
    reviews      = db.Column(db.Text)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    price_history = db.relationship("PriceHistory", backref="product", lazy=True)

    def to_dict(self) -> dict:
        """Serialize to JSON — all nan strings cleaned to None."""
        return {
            "id":           self.id,
            "name":         _clean(self.name) or "Unknown Product",
            "category":     _clean(self.category),      # None if nan
            "sub_category": _clean(self.sub_category),
            "brand":        _clean(self.brand),
            "description":  _clean(self.description),
            "price":        self.price,
            "actual_price": self.actual_price,
            "discount_pct": self.discount_pct,
            "rating":       self.rating if self.rating and self.rating > 0 else None,
            "review_count": self.review_count or 0,
            "image_url":    _clean(self.image_url),
        }


class PriceHistory(db.Model):
    __tablename__ = "price_history"

    id          = db.Column(db.Integer, primary_key=True)
    product_id  = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    price       = db.Column(db.Float, nullable=False)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {"date": self.recorded_at.strftime("%Y-%m-%d"), "price": self.price}


class SearchLog(db.Model):
    __tablename__ = "search_logs"

    id           = db.Column(db.Integer, primary_key=True)
    query        = db.Column(db.String(500), nullable=False)
    result_count = db.Column(db.Integer, default=0)
    searched_at  = db.Column(db.DateTime, default=datetime.utcnow)
