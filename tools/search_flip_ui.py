with open("game.js", "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    l = line.lower()
    if "configurelevelcontrols" in l or "updategravityui" in l or "flipbutton" in l or "checkcurrentzones" in l:
        print(f"Line {i+1}: {line.strip()[:100]}")

