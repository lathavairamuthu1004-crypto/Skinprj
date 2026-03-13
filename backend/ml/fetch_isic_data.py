import os
import json
import urllib.request
import urllib.parse
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR / "dataset" / "train"
API_URL = "https://api.isic-archive.com/api/v2/images/search/"

# Mapping ISIC search queries to project folder names
ISIC_QUERIES = {
    "melanoma": "Melanoma",
    "basal": "Basal Cell Carcinoma",
    "squamous": "Squamous Cell Carcinoma",
    "nevus": "Benign Nevus",
    "actinic": "Actinic Keratosis",
    "dermatofibroma": "Dermatofibroma",
    "vascular": "Vascular Lesion",
}

def fetch_isic_images(query_str, limit=10):
    """Fetches images from ISIC Archive API."""
    print(f"Searching ISIC for: {query_str}...")
    
    encoded_query = urllib.parse.quote(query_str)
    full_url = f"{API_URL}?query={encoded_query}&limit={limit}"
    
    try:
        req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            results = data.get("results", [])
            print(f"  OK: Found {len(results)} images.")
            return results
    except Exception as e:
        print(f"  ERROR: {e}")
        return []

def download_image(img_id, target_path):
    """Downloads a thumbnail from ISIC."""
    img_url = f"https://api.isic-archive.com/api/v2/images/{img_id}/thumbnail/"
    try:
        req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(target_path, 'wb') as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f"  FAIL {img_id}: {e}")
        return False

def main():
    print("--- SkinMorph AI - Dataset Population ---")
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    
    for q_str, f_name in ISIC_QUERIES.items():
        class_dir = DATASET_DIR / f_name
        class_dir.mkdir(parents=True, exist_ok=True)
        
        current_count = len(list(class_dir.glob("*.jpg")))
        results = fetch_isic_images(q_str, limit=5)
        for i, img in enumerate(results):
            isic_id = img["isic_id"]
            target = class_dir / f"{isic_id}.jpg"
            if not target.exists():
                print(f"  [+] {isic_id} -> {f_name}/")
                download_image(isic_id, target)

    print("\n--- Done ---")

if __name__ == "__main__":
    main()
