vx = 260
vy0 = -690
gravity = 1500
dt = 1/60

for jump_x in [300, 320, 340, 350, 355]:
    x = jump_x
    y = 600
    vy = vy0
    for step in range(120):
        t = step * dt
        x += vx * dt
        y += vy * dt
        vy += gravity * dt
        if y >= 600 and vy > 0:
            print(f"Jump from x={jump_x}: lands at x={x:.1f}, t={t:.3f}s")
            break
