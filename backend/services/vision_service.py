"""
RetailMind — Vision Service
Handles high-fidelity image compression, preprocessing, and Anthropic Claude Vision analysis.
"""
import io, base64, logging, json
from PIL import Image
from config import Config

log = logging.getLogger(__name__)

def preprocess_and_compress_image(pil_image, max_size=(800, 800)) -> bytes:
    """
    Downscale and compress image to JPEG to ensure super-fast upload speeds,
    low network bandwidth, and optimal Vision API processing latency.
    """
    try:
        # Copy to avoid modifying original
        img = pil_image.copy()
        
        # Convert RGBA to RGB
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        # Downscale keeping aspect ratio
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80, optimize=True)
        return buf.getvalue()
    except Exception as e:
        log.error(f"Image preprocessing failed: {e}")
        # Return fallback raw bytes if anything fails
        buf = io.BytesIO()
        pil_image.convert("RGB").save(buf, format="JPEG", quality=80)
        return buf.getvalue()


def analyze_product_image_with_claude(pil_image) -> dict:
    """
    Uploads preprocessed image to Anthropic Claude Vision API and extracts
    structured product descriptors: type, brand, probable name, category,
    estimated market price in INR, and visual attributes.
    """
    # 1. Preprocess and compress first
    img_bytes = preprocess_and_compress_image(pil_image)
    img_b64 = base64.b64encode(img_bytes).decode()

    # 2. Call Anthropic Claude Vision
    try:
        import anthropic
        client = anthropic.Anthropic()
        
        prompt = (
            "Analyze this product image. Your task is to perform precise product identification "
            "and return structured information as valid JSON. "
            "Reply with ONLY valid JSON with these exact keys, no markdown code block fences, no introductory text:\n"
            "{\n"
            '  "product_type": "Broad product type, e.g. Smartphone, Headphones, Earbuds, Smartwatch, Charger",\n'
            '  "brand": "Identified brand name or null if generic",\n'
            '  "probable_name": "Most likely exact model or detailed name, e.g. OnePlus Nord CE 3 Lite 5G, Apple iPhone 13",\n'
            '  "category": "Standard e-commerce category hierarchy, e.g. Electronics|Mobiles, Electronics|Wearables",\n'
            '  "visual_description": "2-3 sentences describing the visual appearance, color, form-factor, and features",\n'
            '  "estimated_price": 12999,\n'
            '  "confidence": 0.95,\n'
            '  "key_features": ["feature 1", "feature 2", "feature 3"]\n'
            "}\n"
            "Prices must be realistic estimated prices in the Indian market in INR (integer, no currency symbol).\n"
            "Provide an honest confidence score (between 0.0 and 1.0) based on how clearly you can identify the exact model."
        )

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=450,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64},
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ],
            }]
        )
        raw_text = response.content[0].text.strip()
        
        # Clean markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        
        parsed = json.loads(raw_text.strip())
        log.info(f"Claude Vision successful analysis: {parsed.get('probable_name')}")
        return parsed

    except Exception as e:
        log.error(f"Claude Vision API call failed: {e}. Executing heuristic fallback.")
        # Fallback dictionary if Claude API is down or key is invalid
        return _get_vision_fallback_analysis(pil_image)


def _get_vision_fallback_analysis(pil_image) -> dict:
    """
    Robust heuristic visual analysis fallback if Claude API fails or is not available.
    """
    from routes.image_routes import _heuristic_identify
    query = _heuristic_identify(pil_image)
    
    # Map simple query names to cleaner categories
    category_map = {
        "smartphone": "Electronics|Mobiles",
        "laptop": "Electronics|Computers",
        "watch": "Electronics|Wearables",
        "headphones": "Electronics|Audio",
        "clothing": "Clothing|Apparel"
    }
    
    matched_cat = "Electronics|Accessories"
    for k, v in category_map.items():
        if k in query.lower():
            matched_cat = v
            break

    return {
        "product_type": query.split()[-1].title() if query else "Product",
        "brand": "Generic",
        "probable_name": query.title() if query else "Unidentified Product",
        "category": matched_cat,
        "visual_description": "A scanned retail product. Detailed visual features could not be analyzed due to offline/fallback mode.",
        "estimated_price": 1499,
        "confidence": 0.40,
        "key_features": ["Portable Design", "Standard Functionality"]
    }
