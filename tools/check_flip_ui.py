with open("game.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "updategravityui" in line.lower():
            print(f"{i+1}: {line.strip()[:100]}")
