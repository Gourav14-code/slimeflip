with open("game.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "variable jump" in line.lower() or "jumpcut" in line.lower() or "justup" in line.lower() or "release" in line.lower() and "jump" in line.lower():
            print(f"{i+1}: {line.strip()[:100]}")
