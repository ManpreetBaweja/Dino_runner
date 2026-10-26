# Dino Runner

A small, browser-based endless runner prototype. The first milestone uses keyboard input only; camera controls will be added after the core game feels good.

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server. For example, if Python is installed:

```powershell
py -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Controls

- `Left` / `Right` or `A` / `D`: change lanes
- `Space` or `Arrow Up`: jump, start, or restart
- Hold `Arrow Down` or `S`: duck under hurdles
- Select **Start run** / **Run again** with the mouse or touch

The game is plain HTML, CSS, and JavaScript. It has no build step and no package dependencies.

## Code layout

- `src/game.js`: run state, keyboard input, obstacle spawning, scoring, and the animation loop
- `src/entities.js`: player and obstacle state, movement, and collision rules
- `src/renderer.js`: canvas scene, perspective projection, and sprite drawing
