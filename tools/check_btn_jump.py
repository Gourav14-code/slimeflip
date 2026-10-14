import sys
with open("game.js", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if any(k in line.lower() for k in ["btn-jump", "jumpbtn", "touchjump", "mobilejump"]):
            print(f"{i+1}: {line.strip()[:100]}".encode('ascii', errors='replace').decode('ascii'))
