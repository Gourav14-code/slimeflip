with open("game.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "inittelegraphedhazards" in line.lower() or "buildworld" in line.lower() or "createplatform" in line.lower():
        print(f"Line {i+1}: {line.strip()[:100]}")

