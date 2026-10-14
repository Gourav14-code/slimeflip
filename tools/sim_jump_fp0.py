# Simulate exact Phaser arcade physics for jumping to FP0
vx = 260
vy0 = -690
gravity = 1500
dt = 1/60 # 60 fps step

for jump_x in [300, 320, 340, 350, 355]:
    print(f"=== Jump from x={jump_x}, y=600 ===")
    x = jump_x
    y = 600 # player bottom
    vy = vy0
    landed = False
    for step in range(120):
        t = step * dt
        # arcade physics: pos += vel * dt; vel += acc * dt
        x += vx * dt
        y += vy * dt
        vy += gravity * dt
        # player body width 36, height 48 or 64? Let's check player body in game.js
        # FP0 walkLeft=410, walkRight=510, walkTop=510
        if 410 <= x <= 510:
            print(f"  t={t:.3f}s: x={x:.1f}, y(bottom)={y:.1f}, vy={vy:.1f}")
            if y >= 510 and vy >= 0:
                print(f"  -> LANDED at step {step}, x={x:.1f}, y={y:.1f}, vy={vy:.1f}")
                landed = True
                break
    if not landed:
        print(f"  -> MISSED! At x=510, y={y:.1f}")
