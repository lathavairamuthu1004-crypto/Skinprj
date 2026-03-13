import os
from PIL import Image

removed = 0
for root, _, files in os.walk(r'd:\skinprj\dataset\train'):
    for file in files:
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            filepath = os.path.join(root, file)
            try:
                with Image.open(filepath) as img:
                    img.verify()
            except Exception as e:
                print(f"Removing corrupted image: {filepath} ({e})")
                os.remove(filepath)
                removed += 1
print(f"Removed {removed} corrupted images.")
