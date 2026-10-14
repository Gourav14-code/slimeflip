import json

# Level 9 elements in order
elements = [
    {"name": "Start Island", "type": "ground", "x_start": 0, "x_end": 360, "top_y": 600},
    {"name": "Intro Pit", "type": "pit", "x_start": 360, "x_end": 560, "top_y": 720},
    {"name": "FP0 (Intro)", "type": "fallingPlatform", "x_start": 410, "x_end": 510, "top_y": 510},
    {"name": "Ground Slab 2", "type": "ground", "x_start": 560, "x_end": 3650, "top_y": 600},
    {"name": "S1 Spikes", "type": "spikes", "x_start": 810, "x_end": 890, "top_y": 600},
    {"name": "Saw A (Patrol)", "type": "patrolSaw", "x_start": 1214, "x_end": 1446, "top_y": 564},
    {"name": "Checkpoint 1", "type": "checkpoint_flag", "x_start": 1700, "x_end": 1700, "top_y": 600},
    {"name": "S2 Spikes", "type": "spikes", "x_start": 2250, "x_end": 2380, "top_y": 600},
    {"name": "Saw B (Patrol)", "type": "patrolSaw", "x_start": 2714, "x_end": 2926, "top_y": 564},
    {"name": "Checkpoint 2", "type": "checkpoint_flag", "x_start": 3350, "x_end": 3350, "top_y": 600},
    {"name": "Chain Pit", "type": "pit", "x_start": 3650, "x_end": 4180, "top_y": 720},
    {"name": "P1 (Chain)", "type": "fallingPlatform", "x_start": 3700, "x_end": 3810, "top_y": 510},
    {"name": "P2 (Chain)", "type": "fallingPlatform", "x_start": 3860, "x_end": 3970, "top_y": 420},
    {"name": "P3 (Chain)", "type": "fallingPlatform", "x_start": 4020, "x_end": 4130, "top_y": 510},
    {"name": "Ground Slab 3", "type": "ground", "x_start": 4180, "x_end": 7300, "top_y": 600},
    {"name": "S3 Spikes", "type": "spikes", "x_start": 4500, "x_end": 4555, "top_y": 600},
    {"name": "Checkpoint 3", "type": "checkpoint_flag", "x_start": 4730, "x_end": 4730, "top_y": 600},
    {"name": "Ceiling Slab", "type": "ceiling", "x_start": 4880, "x_end": 5740, "top_y": 130},
    {"name": "Flip Zone F1", "type": "flipZone", "x_start": 4900, "x_end": 5720, "top_y": 0},
    {"name": "Spike Field", "type": "spikes", "x_start": 5300, "x_end": 5600, "top_y": 600},
    {"name": "S4 Spikes", "type": "spikes", "x_start": 6150, "x_end": 6245, "top_y": 600},
    {"name": "Saw C (Patrol)", "type": "patrolSaw", "x_start": 6514, "x_end": 6766, "top_y": 564},
    {"name": "Goal Flag", "type": "goal_flag", "x_start": 7050, "x_end": 7050, "top_y": 600}
]

print("| Element | Type | X Start | X End | Top Y | Dist to Nearest Neighbor |")
print("| :--- | :--- | :---: | :---: | :---: | :---: |")

# Sort elements by x_start
sorted_el = sorted(elements, key=lambda e: e["x_start"])
for i, el in enumerate(sorted_el):
    # calculate distance to nearest neighbor
    dists = []
    for j, other in enumerate(sorted_el):
        if i == j: continue
        # Distance between [el.x_start, el.x_end] and [other.x_start, other.x_end]
        if other["x_end"] < el["x_start"]:
            dists.append(el["x_start"] - other["x_end"])
        elif other["x_start"] > el["x_end"]:
            dists.append(other["x_start"] - el["x_end"])
        else:
            # Overlap or inside (e.g. platform inside pit, field under ceiling slab)
            dists.append(0)
    min_dist = min(dists) if dists else 0
    print(f"| {el['name']} | `{el['type']}` | {el['x_start']} | {el['x_end']} | {el['top_y']} | {min_dist} px |")

