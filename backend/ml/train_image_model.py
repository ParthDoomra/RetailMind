"""
RetailMind — Image Search Model Trainer
Extracts CNN features from product images using ResNet18,
then builds a FAISS index for fast visual similarity search, partitioned by category.

Usage:
    python -m ml.train_image_model

Output:
    trained_models/image_index_<category>.faiss
    trained_models/image_ids_<category>.pkl
"""

import sys
import pickle
import logging
import io
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
import requests
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database.models import Product
from config import Config

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

IMAGE_SIZE    = (224, 224)
BATCH_SIZE    = 32
MAX_PRODUCTS  = 5000  # Cap to avoid excessive download time

def slugify(text: str) -> str:
    """Convert category string to a valid filename slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def load_image_from_url(url: str) -> Image.Image | None:
    """Download and decode a product image. Returns None on failure."""
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        img = Image.open(io.BytesIO(response.content)).convert("RGB")
        return img
    except Exception:
        return None

def extract_features_batch(images: list[Image.Image], model, transform, device) -> np.ndarray:
    """Run a batch of PIL images through ResNet and return feature vectors."""
    import torch

    tensors = torch.stack([transform(img) for img in images]).to(device)
    with torch.no_grad():
        features = model(tensors)
    return features.cpu().numpy()

def train_image_model(
    models_dir: Path = Config.MODELS_DIR,
) -> None:
    """Build category-specific FAISS indices from ResNet18 features."""
    try:
        import torch
        import torchvision.models as tv_models
        import torchvision.transforms as transforms
        import faiss
    except ImportError as e:
        log.error(f"❌ Missing dependency: {e}")
        return

    device = "cuda" if torch.cuda.is_available() else "cpu"
    log.info(f"🖥️  Using device: {device}")

    resnet = tv_models.resnet18(weights=tv_models.ResNet18_Weights.DEFAULT)
    resnet.fc = torch.nn.Identity()
    resnet.eval().to(device)

    transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    app = create_app()
    with app.app_context():
        # Get products with images and categories
        products = Product.query.filter(
            Product.image_url.isnot(None),
            Product.category.isnot(None)
        ).limit(MAX_PRODUCTS).all()

        if not products:
            log.error("❌ No products with image URLs and categories found.")
            return

        log.info(f"🖼️  Processing {len(products)} product images...")

        # Group by category
        category_groups = defaultdict(list)
        for p in products:
            # We use the main category (first part if pipelined, or just lower)
            cat = p.category.split('|')[0].strip().lower()
            if cat:
                category_groups[cat].append(p)

        models_dir.mkdir(parents=True, exist_ok=True)

        for cat, cat_products in category_groups.items():
            slug = slugify(cat)
            log.info(f"📁 Processing category: {cat} ({len(cat_products)} products) -> slug: {slug}")
            
            all_features  = []
            valid_ids     = []
            batch_images  = []
            batch_ids     = []

            for i, product in enumerate(cat_products):
                img = load_image_from_url(product.image_url)
                if img is None:
                    continue

                batch_images.append(img)
                batch_ids.append(product.id)

                if len(batch_images) == BATCH_SIZE:
                    feats = extract_features_batch(batch_images, resnet, transform, device)
                    all_features.extend(feats)
                    valid_ids.extend(batch_ids)
                    batch_images, batch_ids = [], []

            if batch_images:
                feats = extract_features_batch(batch_images, resnet, transform, device)
                all_features.extend(feats)
                valid_ids.extend(batch_ids)

            if not all_features:
                log.warning(f"⚠️  No valid images loaded for category: {cat}")
                continue

            feature_matrix = np.array(all_features, dtype=np.float32)
            faiss.normalize_L2(feature_matrix)

            index = faiss.IndexFlatIP(feature_matrix.shape[1])
            index.add(feature_matrix)

            index_path = models_dir / f"image_index_{slug}.faiss"
            ids_path = models_dir / f"image_ids_{slug}.pkl"

            faiss.write_index(index, str(index_path))
            with open(ids_path, "wb") as f:
                pickle.dump(valid_ids, f)

            log.info(f"✅ Saved index for {cat}: {len(valid_ids)} items")

if __name__ == "__main__":
    train_image_model()

