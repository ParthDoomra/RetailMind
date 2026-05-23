"""RetailMind — Analytics Routes"""
from flask import Blueprint, jsonify
from services.analytics_service import get_dashboard_stats

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.get("/analytics/dashboard")
def dashboard():
    """Return aggregated stats for the analytics dashboard."""
    return jsonify(get_dashboard_stats())
