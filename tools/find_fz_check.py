with open("game.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "last floor hazard in flip zone" in line.lower():
        for j in range(max(0, i - 15), min(len(lines), i + 10)):
            print(f"{j+1}: {lines[j].strip()}")

