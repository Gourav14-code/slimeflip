# 🟢 Slime Flip - 2D Gravity Platformer

A clean, original 2D HTML5 platformer built with **Phaser 3** (offline local bundle) ready to play in your browser and packaged directly into a **Capacitor Android app**.

---

## 🎮 How to Run and Test the Game (Quick & Simple)

Web browsers block loading local images and game files directly from `file://` for security reasons. You simply need a local web server to run it. Here are the easiest ways:

### Option 1: Double-Click (Easiest for Windows!)
Just double-click the file named **`run_game.bat`** in this folder!
* It starts a local web server and automatically opens your browser to `http://localhost:8000`.

### Option 2: Using Python (1 Command)
1. Open PowerShell or Command Prompt in this folder (`c:\ug`).
2. Run:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and go to: **`http://localhost:8000`**

### Option 3: Using Node.js / npx
1. Run:
   ```bash
   npx serve . -l 8000
   ```
2. Open your browser and go to: **`http://localhost:8000`**

### Option 4: VS Code "Live Server"
If you use VS Code, right-click `index.html` and select **"Open with Live Server"**.

---

## 🕹️ Controls

| Action | On-Screen Touch Controls (Mobile) | Keyboard (PC Testing) |
| :--- | :--- | :--- |
| **Move Left** | Tap or hold the **◀** button (bottom-left) | **Left Arrow** or **A** |
| **Move Right** | Tap or hold the **▶** button (bottom-left) | **Right Arrow** or **D** |
| **Gravity Flip** | Tap the **FLIP** button (bottom-right) | **Spacebar**, **W**, or **Up Arrow** |
| **Restart Level** | Tap the **↺** button (top-right) | **R** |
| **Mute / Unmute Sound** | Tap the **🔊 / 🔇** button (top-right) | Mouse click on icon |

---

## 🔄 Core Mechanic: The Gravity Flip

* **Walking on the Floor:** Normal gravity pulls the green slime downwards.
* **Flipping to the Ceiling:** When you tap **FLIP** (or press Spacebar), gravity inverts instantly! The slime flips upside down and flies to the ceiling, allowing you to walk along ceiling platforms.
* **Surface Contact Rule:** You can **only flip when touching a solid surface** (either a floor or a ceiling). In mid-air, the FLIP button dims and locks to prevent infinite flying.
* **Spikes:** Hitting red glowing spikes restarts the level with a fun jelly-pop animation.
* **Goal Flag:** Reach the glowing flag at the end of the cavern to complete the level!

---

## 📁 Project Structure

```
c:\ug\
├── index.html          # Clean web shell (responsive, mobile viewport, orientation lock)
├── game.js             # Main game logic, physics, touch controls, sound synthesizer
├── levels.js           # Simple level layouts (platforms, spikes, goals)
├── phaser.min.js       # Local Phaser 3 library (100% offline, no CDN needed)
├── run_game.bat        # One-click launcher for Windows
├── README.md           # This guide
├── assets/             # Game graphics (clean transparent PNG sprites)
│   ├── slime.png           # Green jelly slime character
│   ├── platform_stone.png  # Crystal cavern floor platform
│   ├── platform_metal.png  # Ceiling girder platform
│   ├── spikes.png          # Deadly red spikes
│   ├── saw.png             # Spinning obstacle
│   ├── goal_flag.png       # Star victory flag
│   ├── background.png      # Parallax cavern background
│   └── icon.png            # App icon (512x512)
```

---

## 🛠️ How to Add More Levels (In `levels.js`)

Open [levels.js](file:///c:/ug/levels.js) in any text editor (like Notepad or VS Code). The file contains simple lists of objects:

```javascript
{
    id: 3,
    name: "Level 3: My Custom Level",
    worldWidth: 2600,
    worldHeight: 540,
    playerStart: { x: 120, y: 390 },

    platforms: [
        // x = horizontal position, y = height (500 is floor, 40 is ceiling)
        { x: 180, y: 490, width: 340, height: 70, type: "stone" },
        { x: 700, y: 40,  width: 440, height: 70, type: "metal" }
    ],

    spikes: [
        // side can be "floor" or "ceiling"
        { x: 500, y: 495, width: 180, height: 45, side: "floor" }
    ],

    goal: { x: 2400, y: 435 }
}
```

* **Floor platforms:** Set `y` around `490` - `500`.
* **Ceiling platforms:** Set `y` around `40` - `60`.
* **Floor spikes:** Set `y: 495`, `side: "floor"`.
* **Ceiling spikes:** Set `y: 45`, `side: "ceiling"`.

---

## 📱 How to Build into a Capacitor Android App

Because `phaser.min.js` and all assets are stored locally using relative paths, this project is 100% ready for Capacitor:

1. In the project folder, initialize Capacitor:
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Slime Flip" "com.slimeflip.game" --web-dir "."
   ```
2. Add Android platform:
   ```bash
   npx cap add android
   ```
3. Copy/sync the game files into the Android project:
   ```bash
   npx cap sync
   ```
4. Open Android Studio to build your APK:
   ```bash
   npx cap open android
   ```
   In Android Studio, click **Run** (or `Build > Build Bundle(s) / APK(s) > Build APK(s)`) to test on your phone or emulator!

