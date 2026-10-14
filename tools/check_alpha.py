from PIL import Image

im = Image.open(r"assets\zone1\falling_platform.png").convert("RGBA")
pixels = im.load()
for y in range(0, 45, 5):
    for x in range(0, 512, 32):
        if pixels[x, y][3] > 20:
            print(f"Non-transparent at ({x}, {y}): alpha={pixels[x, y][3]}")

