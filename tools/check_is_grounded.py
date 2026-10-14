with open("game.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "isgrounded" in line.lower() or "lastgroundedtime" in line.lower():
            print(f"{i+1}: {line.strip()[:100]}")
