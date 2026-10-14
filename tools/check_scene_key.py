with open("game.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "super({" in line or "class gamescene" in line.lower() or "new phaser.game" in line.lower() or "scene:" in line.lower():
            print(f"{i+1}: {line.strip()[:100]}")
