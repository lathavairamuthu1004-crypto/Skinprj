
import sys
import os
import asyncio
from PIL import Image
import numpy as np
import base64

# Mock the backend app structure for easier import
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.detection import SkinDetectionEngine

async def test_engine():
    engine = SkinDetectionEngine()
    
    test_images = [
        ("d:/Downloads/acne.jpg", "Acne Vulgaris"),
        ("d:/Downloads/eczema.jpg", "Eczema (Atopic Dermatitis)"),
        ("d:/Downloads/melanoma.jpg", "Melanoma"),
        ("d:/Downloads/psoriasis.jpg", "Psoriasis"),
        ("d:/Downloads/rosacea.jpg", "Rosacea")
    ]
    
    print("\n--- TESTING DEEP LEARNING MODEL (NEWLY TRAINED) ---")
    
    for img_path, label in test_images:
        if not os.path.exists(img_path):
            continue
        with open(img_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        result = await engine.analyze_image(encoded_string)
        print(f"[{label}] -> Detected: {result.get('disease_name')} (Conf: {result.get('confidence')}) | Model: {result.get('model')}")

if __name__ == "__main__":
    asyncio.run(test_engine())
