vx = 260
vy0 = -690
gravity = 1500
dt = 1/60

for jump_x in [3600, 3620, 3640, 3650]:
    print(f"=== Jump from x={jump_x}, y=600 to P1 (x: 3700..3810, y: 510) ===")
    x = jump_x
    y = 600
    vy = vy0
    for step in range(120):
        t = step * dt
        x += vx * dt
        y += vy * dt
        vy += gravity * dt
        if 3700 <= x <= 3810:
            print(f"  t={t:.3f}s: x={x:.1f}, y={y:.1f}, vy={vy:.1f}")
            if y >= 510 and vy >= 0:
                print(f"  -> LANDED at step {step}, x={x:.1f}, y={y:.1f}, vy={vy:.1f}")
                break

