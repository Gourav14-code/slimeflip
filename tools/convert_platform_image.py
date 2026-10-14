import shutil
from PIL import Image
import numpy as np

src_jpg = r"C:\Users\webgarh\.gemini\antigravity\brain\a6b1f788-2767-4842-ba9a-74e8abcdbbaa\falling_platform_no_shadow_1791977101360.jpg"
target_png = r"c:\ug\assets\zone1\falling_platform.png"
backup_png = r"c:\ug\assets\zone1\falling_platform_old.png"

# 1. Backup old asset
shutil.copyfile(target_png, backup_png)
print(f"Backed up old asset to {backup_png}")

# 2. Open generated image
img = Image.open(src_jpg).convert("RGBA")
arr = np.array(img)

# Detect white/near-white background
# Background is clean white (R > 245, G > 245, B > 245)
r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
is_bg = (r > 242) & (g > 242) & (b > 242)

# Flood-fill or edge feathering for smooth transparent outline
# The image is isolated on pure white, so outside pixels with is_bg become transparent
# Let's do alpha calculation:
alpha = np.ones_like(r, dtype=np.uint8) * 255
# For near-white pixels: smooth transition
min_val = np.minimum(np.minimum(r, g), b)
# Where min_val > 230, start fading out to 0 at 250
mask_fade = min_val > 235
fade_alpha = np.clip((255 - min_val) * (255.0 / 20.0), 0, 255).astype(np.uint8)
alpha[mask_fade] = fade_alpha[mask_fade]
alpha[min_val >= 250] = 0

arr[:, :, 3] = alpha
result = Image.fromarray(arr, mode="RGBA")

# Find non-transparent bounding box
bbox = result.getbbox()
print(f"Object bbox in source: {bbox}")
cropped = result.crop(bbox)

# Target canvas size: 512 x 371
canvas = Image.new("RGBA", (512, 371), (0, 0, 0, 0))

# Fit cropped object into canvas with slight padding
target_h = 350
target_w = int(cropped.width * (target_h / cropped.height))
if target_w > 490:
    target_w = 490
    target_h = int(cropped.height * (target_w / cropped.width))

resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
paste_x = (512 - target_w) // 2
paste_y = (371 - target_h) // 2

canvas.paste(resized, (paste_x, paste_y), resized)
canvas.save(target_png, "PNG")
print(f"Saved upgraded asset to {target_png} with size {canvas.size}")

# Measure walkable surface bounds
c_arr = np.array(canvas)
c_alpha = c_arr[:, :, 3]
y_indices, x_indices = np.where(c_alpha > 50)
print(f"Walkable top Y: {y_indices.min()}")
print(f"Left X: {x_indices.min()}, Right X: {x_indices.max()}, Width: {x_indices.max() - x_indices.min()}")

