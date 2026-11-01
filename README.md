# Dino Runner

A small, browser-based endless runner prototype with keyboard controls and experimental MediaPipe face-motion controls.

## Run locally

Serve this folder with a static web server. Camera access requires `localhost` during development or HTTPS after deployment. For example, if Python is installed:

```powershell
py -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000). Select **Enable camera** and allow camera access. Hold a neutral face position for the two-second calibration; then raise your face to jump and lower it to duck.

## Controls

- `Left` / `Right` or `A` / `D`: change lanes
- `Space` or `Arrow Up`: jump, start, or restart
- Hold `Arrow Down` or `S`: duck under hurdles
- Select **Start run** / **Run again** with the mouse or touch

With the camera enabled, hold a neutral face position for the two-second calibration; raise your face to jump and lower it to duck. Keyboard controls remain available while camera control is active.

The game uses plain HTML, CSS, and JavaScript with no build step. The MediaPipe runtime, WASM files, and Lite pose model are stored in the repository and run in the browser; camera video is not uploaded.

## Code layout

- `src/game.js`: run state, keyboard input, obstacle spawning, scoring, and the animation loop
- `src/entities.js`: player and obstacle state, movement, and collision rules
- `src/renderer.js`: canvas scene, perspective projection, and sprite drawing
- `src/pose.js`: camera lifecycle and MediaPipe Pose Landmarker
- `src/pose-preview.js`: skeleton preview rendering
- `src/gestures.js`: face-based calibration, smoothing, and jump/duck gesture detection
