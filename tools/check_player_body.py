with open("game.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "player.body.setsize" in line.lower() or "player = this.physics.add" in line.lower() or "setsize" in line.lower() and "player" in line.lower():
            print(f"{i+1}: {line.strip()[:100]}")
