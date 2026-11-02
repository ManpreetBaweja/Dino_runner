# Dino Runner

A small, browser-based endless runner prototype with keyboard controls and experimental MediaPipe face-motion controls.

## Run locally

Serve this folder with a static web server. Camera access requires `localhost` during development or HTTPS after deployment. For example, if Python is installed:

```powershell
py -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000). Select **Start video-controlled run** and allow camera access. Center your face in the preview and hold still during the three-second countdown; the run starts when calibration completes.

## Controls

- `Left` / `Right` or `A` / `D`: change lanes
- `Space` or `Arrow Up`: jump, start, or restart
- Hold `Arrow Down` or `S`: duck under hurdles
- Select **Start normal run** or **Start video-controlled run** to choose a mode
- `P` or `Escape`, or select **Pause** / **Resume**, to pause and continue
- In video mode, raise your face to jump and lower it to duck; select **Calibrate again** to recalibrate and begin a fresh run

After a video-controlled run ends, **Run again** starts the same mode without recalibration. The other run button switches modes. A new calibration always begins a fresh video-controlled run. Keyboard controls remain available in either mode.

The game uses plain HTML, CSS, and JavaScript with no build step. The MediaPipe runtime, WASM files, and Lite pose model are stored in the repository and run in the browser; camera video is not uploaded.

## Code layout

- `src/game/`: app entry point, run state, simulation, input, and entities
- `src/pose/`: camera lifecycle, MediaPipe pose tracking, preview, calibration, and gesture controls
- `src/renderer/`: canvas scene composition, projection, and scene drawing
