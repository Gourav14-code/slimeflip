with open("game.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "target_checkpoints" in line.lower() or "checkpoints" in line.lower() and "progression" in line.lower():
        print(f"Line {i+1}: {line.strip()[:100]}")

