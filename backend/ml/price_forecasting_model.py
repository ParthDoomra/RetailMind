"""
RetailMind — Price Forecasting Model
Uses Facebook Prophet (or linear regression fallback) to forecast
future prices for a given product based on its price history.

Usage (as a service, not a standalone trainer):
    from ml.price_forecasting_model import forecast_price

    forecast = forecast_price(product_id=42, periods=30)
"""

import logging
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)


def generate_synthetic_history(
    base_price: float,
    days: int = 180,
) -> pd.DataFrame:
    """
    Generate synthetic price history for products without recorded history.
    Adds realistic seasonal fluctuation and random noise.

    In production: replace this with real price tracking data.
    """
    dates  = pd.date_range(end=datetime.today(), periods=days, freq="D")
    noise  = np.random.normal(0, base_price * 0.03, size=days)
    trend  = np.linspace(0, base_price * 0.05, days)   # slight upward drift
    season = np.sin(np.linspace(0, 4 * np.pi, days)) * base_price * 0.05

    prices = np.clip(base_price + trend + season + noise, base_price * 0.7, base_price * 1.4)

    return pd.DataFrame({"ds": dates, "y": prices})


def forecast_with_prophet(history_df: pd.DataFrame, periods: int) -> pd.DataFrame:
    """
    Run Prophet forecast on the price history.
    Returns a DataFrame with columns: date, price, lower, upper.
    """
    from prophet import Prophet  # type: ignore

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,   # smoothness of trend changes
    )
    model.fit(history_df)

    future   = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)
    result = result.rename(columns={
        "ds":         "date",
        "yhat":       "price",
        "yhat_lower": "lower",
        "yhat_upper": "upper",
    })
    result["date"] = result["date"].dt.strftime("%Y-%m-%d")
    return result


def forecast_with_linear_regression(history_df: pd.DataFrame, periods: int) -> pd.DataFrame:
    """
    Simple linear regression fallback when Prophet is not available.
    Less accurate but zero additional dependencies.
    """
    from sklearn.linear_model import LinearRegression

    x = np.arange(len(history_df)).reshape(-1, 1)
    y = history_df["y"].values

    model = LinearRegression().fit(x, y)

    future_x     = np.arange(len(history_df), len(history_df) + periods).reshape(-1, 1)
    predictions  = model.predict(future_x)
    std          = np.std(y) * 0.5

    future_dates = pd.date_range(
        start=history_df["ds"].iloc[-1] + timedelta(days=1),
        periods=periods,
        freq="D",
    )

    return pd.DataFrame({
        "date":  future_dates.strftime("%Y-%m-%d"),
        "price": np.clip(predictions, 0, None),
        "lower": np.clip(predictions - std, 0, None),
        "upper": predictions + std,
    })


def forecast_price(
    base_price: float,
    price_history: list[dict] | None = None,
    periods: int = 30,
) -> dict:
    """
    Main entry point for price forecasting.

    Args:
        base_price:    Current product price (used when history is sparse).
        price_history: List of {"date": "YYYY-MM-DD", "price": float} dicts.
        periods:       Number of future days to forecast.

    Returns:
        Dict with "history" and "forecast" lists for the frontend chart.
    """
    # Build or use the price history DataFrame
    if price_history and len(price_history) >= 10:
        history_df = pd.DataFrame(price_history).rename(
            columns={"date": "ds", "price": "y"}
        )
        history_df["ds"] = pd.to_datetime(history_df["ds"])
    else:
        history_df = generate_synthetic_history(base_price)

    history_response = [
        {"date": row["ds"].strftime("%Y-%m-%d"), "price": round(row["y"], 2)}
        for _, row in history_df.iterrows()
    ]

    # Try Prophet first; fall back to linear regression
    try:
        forecast_df = forecast_with_prophet(history_df, periods)
        method = "prophet"
    except Exception as e:
        log.warning(f"Prophet unavailable ({e}), using linear regression fallback.")
        forecast_df = forecast_with_linear_regression(history_df, periods)
        method = "linear_regression"

    forecast_response = [
        {
            "date":  row["date"],
            "price": round(row["price"], 2),
            "lower": round(row["lower"], 2),
            "upper": round(row["upper"], 2),
        }
        for _, row in forecast_df.iterrows()
    ]

    return {
        "history":  history_response,
        "forecast": forecast_response,
        "method":   method,
    }
