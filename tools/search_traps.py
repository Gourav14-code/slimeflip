with open("levels.js", "r", encoding="utf-8") as f:
    lvl = None
    for line in f:
        if "id: " in line and "{" in line:
            lvl = line.strip()
        if "trap" in line.lower() or "stalactite" in line.lower() or "corner" in line.lower():
            print(f"{lvl}: {line.strip()}")
