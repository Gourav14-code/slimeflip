import os
from PIL import Image

def process_image(src_path, dst_paths, max_dim=512):
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Flood fill or threshold white background
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r > 240 and g > 240 and b > 240:
                pixels[x, y] = (0, 0, 0, 0)
            elif r > 220 and g > 220 and b > 220:
                avg = (r + g + b) / 3.0
                alpha = int(max(0, 255 - (avg - 220) * (255.0 / 20.0)))
                pixels[x, y] = (r, g, b, alpha)

    bbox = img.getbbox()
    if bbox:
        cropped = img.crop(bbox)
    else:
        cropped = img

    cw, ch = cropped.size
    aspect = cw / ch
    if cw > ch:
        target_w = min(max_dim, cw)
        target_h = int(target_w / aspect)
    else:
        target_h = min(max_dim, ch)
        target_w = int(target_h * aspect)

    resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
    for dst in dst_paths:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        resized.save(dst, "PNG")
    
    file_size_kb = os.path.getsize(dst_paths[0]) / 1024.0
    print(f"Processed {os.path.basename(dst_paths[0])}: {target_w}x{target_h} px, {file_size_kb:.1f} KB")
    return target_w, target_h, file_size_kb

# Process stalactite
src_stalactite = r"C:\Users\malho\.gemini\antigravity\brain\90321d58-ab4d-46c7-bec4-57c12b91657c\zone1_stalactite_big_1792950340511.jpg"
dst_stalactite = [
    r"D:\Slimegame\assets\zone1\zone1_stalactite_big.png",
    r"D:\Slimegame\assets\zone 1\zone1_stalactite_big.png"
]
process_image(src_stalactite, dst_stalactite, max_dim=512)

# Process signpost
src_signpost = r"C:\Users\malho\.gemini\antigravity\brain\90321d58-ab4d-46c7-bec4-57c12b91657c\zone1_signpost_1792950385079.jpg"
dst_signpost = [
    r"D:\Slimegame\assets\zone1\zone1_signpost.png",
    r"D:\Slimegame\assets\zone 1\zone1_signpost.png"
]
process_image(src_signpost, dst_signpost, max_dim=512)

