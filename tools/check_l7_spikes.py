with open("levels.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "level 7:" in line.lower():
        for j in range(i, i + 100):
            if "spikes" in lines[j].lower():
                for k in range(j, j + 25):
                    print(lines[k].strip())
                break
        break

