import os

print("--- Listing c:\\ug\\assets ---")
if os.path.exists(r"c:\ug\assets"):
    for item in os.listdir(r"c:\ug\assets"):
        full = os.path.join(r"c:\ug\assets", item)
        print(f"  {item} ({'DIR' if os.path.isdir(full) else 'FILE'})")

print("--- Checking 'zone 1' with space ---")
if os.path.exists(r"c:\ug\assets\zone 1"):
    for item in os.listdir(r"c:\ug\assets\zone 1"):
        print(f"  zone 1 -> {item}")

print("--- Checking 'zone1' without space ---")
if os.path.exists(r"c:\ug\assets\zone1"):
    for item in os.listdir(r"c:\ug\assets\zone1"):
        if "stone" in item.lower() or "dark" in item.lower() or "cub" in item.lower():
            print(f"  zone1 -> {item}")

