import os

def check_dir(p):
    print("Checking:", p)
    if os.path.exists(p):
        for f in os.listdir(p):
            print("  ", f)
    else:
        print("  DOES NOT EXIST")

check_dir("c:/ug/assets/zone1")
check_dir("c:/ug/assets/zone 1")
check_dir("D:/Slimegame/assets/zone 1")

