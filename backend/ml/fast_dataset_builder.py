"""
Fast parallel dataset builder using ISIC Archive API (v2).
Downloads thumbnail images concurrently — no login, no zip needed.
Run from: d:/skinprj/
"""

import os, sys, json, urllib.request, urllib.parse, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Force UTF-8 on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Config ──────────────────────────────────────────────────────────────────
BASE_DIR         = Path(__file__).resolve().parent.parent.parent
DATASET_DIR      = BASE_DIR / "dataset" / "train"
IMAGES_PER_CLASS = 60    # target images per class
MAX_WORKERS      = 12    # parallel download threads
ISIC_BASE        = "https://api.isic-archive.com/api/v2/images/"
HEADERS          = {"User-Agent": "SkinMorphAI/1.0"}

# ── ISIC diagnosis filter → folder name ─────────────────────────────────────
# ISIC metadata.clinical.diagnosis_3 values (partial match used)
ISIC_CLASSES = {
    "Melanoma":                  {"terms": ["melanoma"],             "folder": "Melanoma"},
    "Basal Cell Carcinoma":      {"terms": ["basal cell"],           "folder": "Basal Cell Carcinoma"},
    "Squamous Cell Carcinoma":   {"terms": ["squamous cell"],        "folder": "Squamous Cell Carcinoma"},
    "Benign Nevus":              {"terms": ["Nevus", "nevus"],       "folder": "Benign Nevus"},
    "Actinic Keratosis":         {"terms": ["actinic", "keratosis"], "folder": "Actinic Keratosis"},
    "Dermatofibroma":            {"terms": ["dermatofibroma"],       "folder": "Dermatofibroma"},
    "Vascular Lesion":           {"terms": ["vascular", "angioma"],  "folder": "Vascular Lesion"},
    "Acne Vulgaris":             {"terms": ["acne"],                 "folder": "Acne Vulgaris"},
    "Eczema (Atopic Dermatitis)":{"terms": ["eczema", "dermatitis"], "folder": "Eczema (Atopic Dermatitis)"},
    "Psoriasis":                 {"terms": ["psoriasis"],            "folder": "Psoriasis"},
    "Rosacea":                   {"terms": ["rosacea"],              "folder": "Rosacea"},
}

# ── API helpers ───────────────────────────────────────────────────────────────

def fetch_page(offset: int = 0, limit: int = 200):
    """Fetch a page of images from ISIC. Returns list of result dicts."""
    url = f"{ISIC_BASE}?limit={limit}&offset={offset}"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read()).get("results", [])
    except Exception as e:
        print(f"  [fetch_page error] offset={offset}: {e}")
        return []

def get_thumbnail_url(img: dict) -> str:
    """Extract the thumbnail URL from an image result."""
    return img.get("files", {}).get("thumbnail_256", {}).get("url", "")

def get_diagnosis(img: dict) -> str:
    """Get the primary diagnosis string from image metadata."""
    clinical = img.get("metadata", {}).get("clinical", {})
    # Try diagnosis fields in priority order
    for key in ["diagnosis_3", "diagnosis_2", "diagnosis_1"]:
        val = clinical.get(key, "")
        if val:
            return val.lower()
    return ""

def matches_class(diagnosis: str, terms: list) -> bool:
    return any(t.lower() in diagnosis for t in terms)

def download_thumbnail(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    if not url:
        return False
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as r:
            dest.write_bytes(r.read())
        return True
    except Exception:
        return False

# ── Smart batch downloader ────────────────────────────────────────────────────

def build_dataset(target_per_class: int = IMAGES_PER_CLASS, scan_pages: int = 30):
    """
    Scans ISIC pages and routes each image to the correct class folder.
    Much faster than querying per-class — one pass fills everything.
    """
    # Setup folders & track remaining slots
    remaining = {}
    for name, cfg in ISIC_CLASSES.items():
        d = DATASET_DIR / cfg["folder"]
        d.mkdir(parents=True, exist_ok=True)
        existing = len(list(d.glob("*.*")))
        needed   = max(0, target_per_class - existing)
        remaining[name] = needed
        status = "[OK]" if needed == 0 else f"[need {needed}]"
        print(f"  {status:12s} {cfg['folder']}")

    print(f"\n  Scanning up to {scan_pages} pages of ISIC ({scan_pages*200} images)...")

    # Accumulators
    buckets: dict[str, list] = {n: [] for n in ISIC_CLASSES}

    for page in range(scan_pages):
        if all(v == 0 for v in remaining.values()):
            print(f"  All classes filled after page {page}!")
            break
        results = fetch_page(offset=page * 200, limit=200)
        if not results:
            break
        for img in results:
            diag = get_diagnosis(img)
            if not diag:
                continue
            url  = get_thumbnail_url(img)
            isic_id = img.get("isic_id", f"img_{page}")
            for name, cfg in ISIC_CLASSES.items():
                if remaining[name] > 0 and matches_class(diag, cfg["terms"]):
                    buckets[name].append((url, isic_id, cfg["folder"]))
                    remaining[name] -= 1
                    break   # each image goes to at most one class
        filled = sum(1 for v in remaining.values() if v == 0)
        print(f"  Page {page+1:2d}: {filled}/{len(ISIC_CLASSES)} classes filled")

    # Parallel downloads
    print(f"\n  Downloading images with {MAX_WORKERS} threads...")
    total_ok = 0
    all_tasks = []
    for name, tasks in buckets.items():
        folder = DATASET_DIR / ISIC_CLASSES[name]["folder"]
        for url, isic_id, _ in tasks:
            dest = folder / f"{isic_id}.jpg"
            all_tasks.append((url, dest, name))

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(download_thumbnail, url, dest): name
                   for url, dest, name in all_tasks}
        done = 0
        for f in as_completed(futures):
            done += 1
            if f.result():
                total_ok += 1
            if done % 50 == 0:
                print(f"    ... {done}/{len(all_tasks)} done ({total_ok} saved)")

    return total_ok

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 57)
    print("  SkinMorph AI -- Fast Parallel Dataset Builder (ISIC v2)")
    print(f"  Target: {IMAGES_PER_CLASS} images/class | Threads: {MAX_WORKERS}")
    print("=" * 57)
    print("\nCurrent state:")
    t0 = time.time()

    total_ok = build_dataset()

    print("\n" + "=" * 57)
    print("  Final image counts:")
    grand_total = 0
    for d in sorted(DATASET_DIR.iterdir()):
        if d.is_dir():
            n = len(list(d.glob("*.*")))
            grand_total += n
            status = "[OK]" if n >= IMAGES_PER_CLASS else "[!!]" if n > 0 else "[--]"
            print(f"  {status:6s} {d.name:<36} {n:>4} images")
    print(f"\n  Total  : {grand_total} images across {len(list(DATASET_DIR.iterdir()))} classes")
    print(f"  DL'd   : {total_ok} new thumbnails")
    print(f"  Time   : {time.time()-t0:.1f}s")
    print("=" * 57)

if __name__ == "__main__":
    main()
