with open("game.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "falling_platform" in line.lower() or "fallingplatform" in line.lower() or "fall_shake" in line.lower():
        print(f"Line {i+1}: {line.strip()[:100]}")

