"""
RetailMind — Memory Cache for Generated Products
Stores products dynamically created by Claude Vision / LLM fallbacks
so they can be requested by /api/product/<id> and /api/product/<id>/insights.
"""

_generated_products = {}

def get_cached_product(product_id: int) -> dict | None:
    return _generated_products.get(product_id)

def set_cached_product(product_id: int, product_dict: dict):
    _generated_products[product_id] = product_dict
