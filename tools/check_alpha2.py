from PIL import Image

im = Image.open(r"assets\zone1\falling_platform.png").convert("RGBA")
pixels = im.load()
for y in range(0, 42):
    for x in range(512):
        if pixels[x, y][3] > 0:
            print(f"y={y}, x={x}, rgba={pixels[x, y]}")

