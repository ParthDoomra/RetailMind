"""RetailMind — General helper utilities."""
import re
from math import ceil

def paginate_list(items: list, page: int, per_page: int) -> dict:
    total = len(items)
    start = (page - 1) * per_page
    end   = start + per_page
    return {"items": items[start:end], "total": total, "page": page,
            "per_page": per_page, "total_pages": ceil(total / per_page) if per_page else 1}

def truncate(text: str, max_length: int = 200) -> str:
    if not text: return ""
    return text[:max_length] + "..." if len(text) > max_length else text

def safe_float(value, default: float = 0.0) -> float:
    try:    return float(value)
    except: return default
