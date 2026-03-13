import os
from PIL import Image

removed: int = 0
base_path = r'd:\skinprj\dataset'

if not os.path.exists(base_path):
    print(f"Dataset path not found: {base_path}")
    exit(1)

for folder in ['train', 'test']:
    dataset_path = os.path.join(base_path, folder)
    if not os.path.exists(dataset_path):
        continue
        
    print(f"Checking images in {dataset_path}...")
    for root, _, files in os.walk(dataset_path):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                filepath = os.path.join(root, file)
                try:
                    with Image.open(filepath) as img:
                        img.load()  # More thorough than verify() as it decodes the image data
                except Exception as e:
                    print(f"Removing corrupted image: {filepath} ({e})")
                    try:
                        os.remove(filepath)
                        removed += 1
                    except Exception as ex:
                        print(f"Could not remove {filepath}: {ex}")

print(f"\nScan complete. Removed {removed} corrupted images.")
