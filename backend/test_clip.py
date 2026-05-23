import sys
from PIL import Image
import urllib.request
import io
from transformers import CLIPProcessor, CLIPModel
import torch

def test_clip():
    print("Loading model...")
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    print("Model loaded.")
    
    categories = [
        "smartphone", "laptop computer", "headphones", "earbuds",
        "smartwatch", "digital camera", "television", "gaming console",
        "computer mouse", "computer keyboard", "computer monitor",
        "tablet computer", "speaker", "charger adapter", "usb cable",
        "power bank", "router", "drone", "vacuum cleaner", "blender",
        "coffee maker", "microwave oven", "refrigerator", "washing machine",
        "desk chair", "sofa", "bed", "dining table", "shoes", "t-shirt",
        "jacket", "jeans", "watch", "sunglasses", "backpack", "handbag",
        "book", "toys", "board game", "cosmetics", "perfume"
    ]

    # download a test image of a mouse
    req = urllib.request.Request(
        "https://m.media-amazon.com/images/I/61UxfXTUyvL._AC_SL1500_.jpg",
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        img = Image.open(io.BytesIO(response.read()))

    inputs = processor(text=categories, images=img, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        
    best_idx = probs.argmax().item()
    best_category = categories[best_idx]
    print(f"Predicted: {best_category} ({probs[0, best_idx].item():.2f})")

if __name__ == "__main__":
    test_clip()
