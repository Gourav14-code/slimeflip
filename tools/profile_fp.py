from PIL import Image

im = Image.open(r"assets\zone1\falling_platform.png").convert("RGBA")
w, h = im.size
pixels = im.load()

# Let's inspect rows around y=0..370 to see where the slab is
row_widths = []
for y in range(0, h, 10):
    xs = [x for x in range(w) if pixels[x, y][3] > 100]
    if xs:
        row_widths.append((y, min(xs), max(xs), max(xs)-min(xs)+1))

for rw in row_widths[:20]:
    print(f"y={rw[0]}: x=[{rw[1]}, {rw[2]}], w={rw[3]}")

