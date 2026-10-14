with open("levels.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "level 8:" in line.lower() or "level 9:" in line.lower():
        print(f"Line {i+1}: {line.strip()[:100]}")

