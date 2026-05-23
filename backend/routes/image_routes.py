"""
RetailMind — Image & Camera Routes (v6 — Claude Vision powered)

When user points camera at a product:
1. Claude Vision looks at the image and identifies the product
2. Claude returns structured product details (name, category, brand, type)
3. We search our 186k catalog for the best matches
4. Return ranked results to frontend

This uses the ANTHROPIC_API_KEY from environment.
"""

import io, base64, logging, os, re
from flask import Blueprint, request, jsonify
from database.db import db
from database.models import Product
from services.product_search_service import search_products_smart

image_bp = Blueprint("image", __name__)
log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# CLAUDE VISION — core recognition engine
# ─────────────────────────────────────────────────────────────────────────────

def _identify_with_claude(pil_image) -> dict:
    """
    Send image to Claude Vision. Returns:
    {
        "query":       "search string for catalog",
        "product_name": "what Claude thinks it is",
        "category":    "Electronics / Clothing / etc",
        "confidence":  "high / medium / low",
        "description": "brief description"
    }
    """
    import anthropic as _anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set in environment")

    # Resize to save tokens — 384px is enough for product ID
    buf = io.BytesIO()
    pil_image.convert("RGB").resize((384, 384)).save(buf, format="JPEG", quality=80)
    img_b64 = base64.b64encode(buf.getvalue()).decode()

    client = _anthropic.Anthropic(api_key=api_key)

    response = client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": img_b64,
                    },
                },
                {
                    "type": "text",
                    "text": """Analyze this image and identify the product shown.

Reply in this EXACT format (one line each):
PRODUCT: <product name, be specific>
CATEGORY: <Electronics / Clothing / Footwear / HomeKitchen / Beauty / Accessories / Other>
BRAND: <brand if visible, else Unknown>
SEARCH: <3-6 word search query to find this in an e-commerce catalog>
CONFIDENCE: <high / medium / low>

Rules:
- If person is HOLDING something, identify what they're holding
- Be specific: not just "phone" but "smartphone" or "iPhone"
- SEARCH should be what a customer would type to find this product
- Keep each line short and factual"""
                }
            ],
        }]
    )

    raw = response.content[0].text.strip()
    log.info(f"Claude Vision raw response:\n{raw}")

    # Parse the structured response
    result = {
        "query":        "product",
        "product_name": "Unknown product",
        "category":     "Other",
        "brand":        "Unknown",
        "confidence":   "low",
        "description":  raw,
    }

    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith("PRODUCT:"):
            result["product_name"] = line.split(":", 1)[1].strip()
        elif line.startswith("CATEGORY:"):
            result["category"] = line.split(":", 1)[1].strip()
        elif line.startswith("BRAND:"):
            result["brand"] = line.split(":", 1)[1].strip()
        elif line.startswith("SEARCH:"):
            result["query"] = line.split(":", 1)[1].strip().lower()
        elif line.startswith("CONFIDENCE:"):
            result["confidence"] = line.split(":", 1)[1].strip().lower()

    log.info(f"Parsed: product='{result['product_name']}' query='{result['query']}' confidence={result['confidence']}")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# HEURISTIC FALLBACK — smart multi-signal analysis
# ─────────────────────────────────────────────────────────────────────────────

def _heuristic_identify(pil_image) -> dict:
    """
    Multi-signal heuristic when Claude Vision is unavailable.
    Analyses: aspect ratio, edge density, brightness zones, color dominance,
    center-vs-edge contrast, and vertical brightness gradient.
    """
    try:
        import numpy as np
        from PIL import ImageFilter, ImageEnhance

        img  = pil_image.convert("RGB").resize((224, 224))
        arr  = np.array(img, dtype=np.float32)           # (224,224,3)
        gray = np.mean(arr, axis=2)                       # (224,224)
        w, h = pil_image.size
        aspect = w / max(h, 1)

        # --- Basic stats ---
        brightness = arr.mean()
        r_m = arr[:,:,0].mean()
        g_m = arr[:,:,1].mean()
        b_m = arr[:,:,2].mean()

        # --- Edge density (more edges = structured object, not fabric) ---
        from PIL import Image as _PIL
        edge_arr = np.array(_PIL.fromarray(arr.astype(np.uint8)).convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32)
        edge_density = edge_arr.mean()          # 0-255
        has_edges    = edge_density > 8         # lower threshold — real photos always have some noise
        strong_edges = edge_density > 20

        # --- Center vs edge brightness (products tend to be centred) ---
        center = gray[56:168, 56:168].mean()
        edge   = np.concatenate([gray[:56].ravel(), gray[168:].ravel(),
                                  gray[:,  :56].ravel(), gray[:, 168:].ravel()]).mean()
        center_contrast = abs(center - edge)

        # --- Vertical gradient (cable/charger = uniform top-to-bottom) ---
        top_half    = gray[:112].mean()
        bottom_half = gray[112:].mean()
        v_gradient  = abs(top_half - bottom_half)

        # --- Color saturation ---
        max_c = np.maximum(np.maximum(arr[:,:,0], arr[:,:,1]), arr[:,:,2])
        min_c = np.minimum(np.minimum(arr[:,:,0], arr[:,:,1]), arr[:,:,2])
        saturation = (max_c - min_c).mean()

        is_dark        = brightness < 85
        is_white_bg    = brightness > 200 and saturation < 25
        is_low_sat     = saturation < 30
        is_uniform     = edge_density < 5      # very few edges = fabric / plain object
        # Cable: VERY elongated (aspect < 0.28 or > 3.5) — normal phones won't hit this
        is_cable_like  = (aspect > 3.5 or aspect < 0.28) and edge_density < 15

        log.info(f"Heuristic signals: aspect={aspect:.2f} edges={edge_density:.1f} "
                 f"bright={brightness:.0f} sat={saturation:.1f} "
                 f"center_contrast={center_contrast:.1f} v_grad={v_gradient:.1f}")

        # ── Decision tree (order matters — most specific first) ──────────────
        if is_cable_like:
            # Very elongated = cable, charger, wire
            q    = "USB cable charger wire"
            cat  = "Electronics"

        elif is_white_bg and strong_edges and 0.8 < aspect < 1.3:
            # White product photo on white bg = typical Amazon listing
            if r_m > g_m + 10 and r_m > b_m + 10:
                q = "red product electronics"
            else:
                q = "electronics accessory"
            cat = "Electronics"

        elif aspect < 0.6 and has_edges:
            # Tall narrow = smartphone in portrait
            q   = "smartphone mobile phone"
            cat = "Electronics"

        elif aspect > 2.5 and strong_edges:
            # Very wide = laptop, TV, monitor
            q = "laptop computer notebook" if brightness > 150 else "television monitor screen"
            cat = "Electronics"

        elif aspect > 1.35 and has_edges:
            # Wide rectangular with edges = phone in landscape OR tablet
            if aspect > 1.8:
                q = "tablet iPad android"              # wider = tablet
            else:
                q = "smartphone mobile phone"          # 1.35–1.8 = phone in landscape (most common)
            cat = "Electronics"

        elif 0.6 <= aspect <= 1.35 and strong_edges and is_dark:
            # Dark squarish rectangle with strong edges = phone, remote, or device
            q   = "smartphone mobile phone"
            cat = "Electronics"

        elif 0.6 <= aspect <= 1.35 and strong_edges and not is_dark:
            # Bright squarish + lots of edges = small electronic gadget
            q   = "electronic gadget device"
            cat = "Electronics"

        elif strong_edges and is_dark:
            # Dark + edges = generic electronics
            q   = "electronics gadget device"
            cat = "Electronics"

        elif is_low_sat and is_uniform:
            q   = "USB charger cable adapter"
            cat = "Electronics"

        elif b_m > r_m + 18 and b_m > g_m + 10 and not has_edges:
            q   = "blue denim jeans"
            cat = "Clothing"

        elif g_m > r_m + 12 and not has_edges:
            q   = "green clothing top"
            cat = "Clothing"

        elif r_m > b_m + 20 and not has_edges:
            q   = "red clothing shirt"
            cat = "Clothing"

        elif is_uniform and not has_edges:
            # Fabric / textile
            q   = "clothing t-shirt top"
            cat = "Clothing"

        else:
            q   = "electronics product"
            cat = "Electronics"

        return {
            "query":        q,
            "product_name": q.title(),
            "category":     cat,
            "brand":        "Unknown",
            "confidence":   "low",
            "description":  f"Heuristic detection (edges={edge_density:.0f} aspect={aspect:.2f})",
        }

    except Exception as ex:
        log.warning(f"Heuristic failed: {ex}")
        return {"query": "electronics product", "product_name": "Electronics Product",
                "category": "Electronics", "brand": "Unknown",
                "confidence": "low", "description": ""}

# ─────────────────────────────────────────────────────────────────────────────
# CATALOG SEARCH
# ─────────────────────────────────────────────────────────────────────────────

def _search_catalog(identification: dict) -> list[dict]:
    """
    Search the catalog using Claude's identified query.
    Also tries category-boosted search if initial results are weak.
    """
    query    = identification["query"]
    category = identification.get("category", "")
    brand    = identification.get("brand", "Unknown")

    # Build an enriched query
    enriched = query
    if brand and brand.lower() not in ("unknown", ""):
        enriched = f"{brand} {query}"

    log.info(f"Searching catalog for: '{enriched}'")

    ranked = search_products_smart(enriched, top_n=25)

    # If very few results, retry with base query (without brand prefix)
    if len(ranked) < 5 and enriched != query:
        log.info(f"Few results with brand, retrying with: '{query}'")
        ranked = search_products_smart(query, top_n=25)

    if not ranked:
        return []

    score_map = {r["product_id"]: r["score"] for r in ranked}
    products  = db.session.query(Product).filter(
        Product.id.in_(list(score_map.keys()))
    ).all()

    results = []
    for p in sorted(products, key=lambda x: score_map.get(x.id, 0), reverse=True):
        d = p.to_dict()
        d["relevance_score"] = score_map[p.id]
        results.append(d)

    return results


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

def _process_image(pil_image) -> dict:
    """
    Full pipeline: identify → search → return response dict.
    Never raises — always returns a valid JSON-serializable dict.
    """
    api_error_msg = None

    # Step 1: identify with Claude, fallback to heuristic
    try:
        identification = _identify_with_claude(pil_image)
        source = "claude_vision"
    except ImportError:
        log.warning("anthropic not installed — using heuristic")
        identification = _heuristic_identify(pil_image)
        source = "heuristic"
    except ValueError as e:
        log.warning(f"API key issue: {e} — using heuristic")
        identification = _heuristic_identify(pil_image)
        source = "heuristic"
    except Exception as e:
        err_str = str(e)
        # Detect credit/billing errors and surface them clearly
        if "credit balance" in err_str or "billing" in err_str.lower() or "402" in err_str:
            api_error_msg = "Anthropic API has no credits. Top up at console.anthropic.com. Using smart visual analysis instead."
            log.warning(f"Anthropic billing error — switching to heuristic. Detail: {e}")
        else:
            log.error(f"Claude Vision error: {e}")
        identification = _heuristic_identify(pil_image)
        source = "heuristic_fallback"

    log.info(f"Identified as: '{identification['query']}' via {source}")

    # Step 2: search catalog — try multiple query variants for best coverage
    try:
        results = _search_catalog(identification)

        # If heuristic gave poor results (< 3), try alternate queries
        if source != "claude_vision" and len(results) < 3:
            alt_queries = [
                identification["query"].split()[0],           # first word only
                identification["category"].lower(),           # just the category
                identification["query"].replace(" ", " OR "), # looser match
            ]
            for alt_q in alt_queries:
                if alt_q and alt_q != identification["query"]:
                    alt_id = dict(identification, query=alt_q)
                    alt_results = _search_catalog(alt_id)
                    if len(alt_results) > len(results):
                        results = alt_results
                        log.info(f"Better results with alt query: '{alt_q}'")
                        break
    except Exception as e:
        log.error(f"Catalog search error: {e}")
        results = []

    response = {
        "source":            source,
        "detected_product":  identification["product_name"],
        "detected_query":    identification["query"],
        "detected_category": identification["category"],
        "confidence":        identification["confidence"],
        "query":             identification["query"],
        "results":           results[:20],
        "total":             len(results),
    }
    if api_error_msg:
        response["api_warning"] = api_error_msg
    return response


@image_bp.post("/camera-recognize")
def camera_recognize():
    """
    POST { "image": "data:image/jpeg;base64,..." }
    → Claude Vision identifies product → catalog search → results
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data or "image" not in data:
            return jsonify({"error": "Send JSON: {image: 'data:image/jpeg;base64,...'}"}), 400

        raw = data["image"]
        if "," in raw:
            raw = raw.split(",", 1)[1]

        from PIL import Image
        img_bytes = base64.b64decode(raw)
        pil_img   = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    except Exception as e:
        log.error(f"Image decode error: {e}")
        return jsonify({"error": f"Cannot decode image: {str(e)}"}), 400

    response = _process_image(pil_img)
    return jsonify(response)


@image_bp.post("/image-search")
def image_search():
    """
    POST multipart/form-data with key 'image'
    → Claude Vision identifies product → catalog search → results
    """
    if "image" not in request.files:
        return jsonify({"error": "Send image as multipart/form-data key 'image'"}), 400

    try:
        from PIL import Image
        pil_img = Image.open(request.files["image"].stream).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Cannot read image: {str(e)}"}), 400

    response = _process_image(pil_img)
    return jsonify(response)
