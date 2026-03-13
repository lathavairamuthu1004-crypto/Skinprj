"""
Fills missing classes in the dataset using DuckDuckGo Image Search.
Downloads up to 60 images for the remaining classes.
"""

import os, sys, time, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from duckduckgo_search import DDGS

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR / "dataset" / "train"
TARGET_IMAGES = 60
MAX_WORKERS = 8

# Mapping folder names to their search terms
DDG_TERMS = {
    "Acne Vulgaris": "acne vulgaris clinical photo",
    "Actinic Keratosis": "actinic keratosis lesion",
    "Basal Cell Carcinoma": "basal cell carcinoma clinical",
    "Benign Nevus": "benign nevus mole clinical",
    "Dermatofibroma": "dermatofibroma skin lesion",
    "Eczema (Atopic Dermatitis)": "eczema atopic dermatitis clinical",
    "Melanoma": "melanoma skin cancer clinical",
    "Psoriasis": "psoriasis plaque skin",
    "Rosacea": "rosacea face clinical",
    "Squamous Cell Carcinoma": "squamous cell carcinoma skin clinical",
    "Vascular Lesion": "cherry angioma vascular lesion skin"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def download_image(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            dest.write_bytes(r.read())
        return True
    except Exception:
        return False

def fill_class(folder_name: str, search_term: str):
    folder = DATASET_DIR / folder_name
    folder.mkdir(parents=True, exist_ok=True)
    existing = len(list(folder.glob("*.*")))
    needed = max(0, TARGET_IMAGES - existing)
    if needed <= 0:
        print(f"  [OK]  {folder_name} (already has {existing})")
        return 0
        
    print(f"  [DL]  {folder_name} -> fetching {needed} (searching '{search_term}')")
    
    urls = []
    for retry in range(3):
        try:
            results = DDGS().images(
                keywords=search_term,
                region="wt-wt",
                safesearch="off",
                size="Medium",
                max_results=needed + 30
            )
            urls = [r["image"] for r in results if r.get("image")]
            break
        except Exception as e:
            print(f"    [ERR] Search failed (try {retry+1}): {e}")
            time.sleep(3)
            
    if not urls:
        print("    [!!] Giving up on this search.")
        return 0
    
    ok = 0
    futures = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        for i, url in enumerate(urls[:needed*2]): # search more to cover fail cases
            if ok >= needed:
                break
            ext = url.split("?")[0].rsplit(".", 1)[-1].lower()
            if ext not in ["jpg", "jpeg", "png", "webp"]:
                ext = "jpg"
            dest = folder / f"ddgs_{i:04d}.{ext}"
            futures[pool.submit(download_image, url, dest)] = url
            
        for f in as_completed(futures):
            if f.result():
                ok += 1
            if ok >= needed:
                # Cancel remaining downloads if we hit target (ThreadPool doesn't support cancel directly, but logic ignores rest)
                break
                
    actual_existing = len(list(folder.glob("*.*")))
    print(f"    -> Done. Class now has {actual_existing} images.")
    return ok

def main():
    print("=" * 60)
    print(" DuckDuckGo Image Dataset Filler ")
    print("=" * 60)
    
    total_dl = 0
    for folder, term in DDG_TERMS.items():
        total_dl += fill_class(folder, term)
        time.sleep(2) # Prevent rate limiting
        
    print("\n" + "=" * 60)
    print(" Final Verification ")
    for folder in sorted(DDG_TERMS.keys()):
        d = DATASET_DIR / folder
        count = len(list(d.glob("*.*"))) if d.exists() else 0
        status = "[OK]" if count >= TARGET_IMAGES else "[!!]"
        print(f"  {status} {folder:<30} {count:>4} imgs")
        
if __name__ == "__main__":
    main()
