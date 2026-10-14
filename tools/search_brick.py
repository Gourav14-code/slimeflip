import re

keywords = ["brick", "corner", "rubble", "particle", "debris", "falling_stalactite", "shake", "drop"]
with open("game.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        for kw in ["brick", "corner", "rubble"]:
            if kw in line.lower():
                print(f"game.js:{i+1}: {line.strip()[:100]}")

with open("LEVEL_DESIGN.md", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        for kw in ["brick", "corner", "rubble"]:
            if kw in line.lower():
                print(f"LEVEL_DESIGN.md:{i+1}: {line.strip()[:100]}")
