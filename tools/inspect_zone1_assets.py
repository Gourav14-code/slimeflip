import os
from PIL import Image

zone1_dir = "assets/zone1"
for fname in sorted(os.listdir(zone1_dir)):
    if fname.endswith((".png", ".webp")):
        path = os.path.join(zone1_dir, fname)
        im = Image.open(path)
        print(f"{fname:30} : {im.size} : mode={im.mode}")
