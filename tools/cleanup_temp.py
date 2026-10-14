import os

temp_files = [
    'tools/measure_screenshot.py',
    'tools/test_flip_scenario.js',
    'tools/search_zones.js',
    'tools/search_flipy.js',
    'tools/check_slime_assets.js',
    'tools/check_slime_orientation.py',
    'tools/find_slime_exact.py',
    'tools/crop_ceiling_slime.py',
    'tools/inspect_crop.py',
    'tools/test_flip_render.py',
    'tools/ceiling_slime.png'
]

for f in temp_files:
    if os.path.exists(f):
        os.remove(f)
        print('Removed:', f)

