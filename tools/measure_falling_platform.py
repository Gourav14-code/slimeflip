from PIL import Image
import numpy as np

img = Image.open(r"c:\ug\assets\zone1\falling_platform.png")
arr = np.array(img)
alpha = arr[:, :, 3]

# Find top edge for each column where alpha > 128
top_y = []
for x in range(img.width):
    col = np.where(alpha[:, x] > 128)[0]
    if len(col) > 0:
        top_y.append((x, col.min()))

# Print top edge profile
print("Top edge points (sample):")
for x, y in top_y[::20]:
    print(f"x={x}: y={y}")

min_x = min(x for x, y in top_y)
max_x = max(x for x, y in top_y)
min_y = min(y for x, y in top_y)
print(f"Overall bounds: x in [{min_x}, {max_x}], min y = {min_y}")

# Flat portion across the top:
flat_points = [x for x, y in top_y if y <= min_y + 12]
print(f"Flat top span: x in [{min(flat_points)}, {max(flat_points)}], width = {max(flat_points) - min(flat_points)}")
