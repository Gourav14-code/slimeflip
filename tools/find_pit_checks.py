with open("game.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "pit" in line.lower() and ("warning" in line.lower() or "report" in line.lower() or "canreach" in line.lower()):
        print(f"Line {i+1}: {line.strip()[:100]}")

