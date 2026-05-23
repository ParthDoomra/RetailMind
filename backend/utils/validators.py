"""RetailMind — Request validators."""
def require_query_param(name: str, value: str) -> dict | None:
    if not value or not value.strip():
        return {"error": f"Query parameter '{name}' is required."}
    if len(value) > 500:
        return {"error": f"Query parameter '{name}' exceeds maximum length."}
    return None
