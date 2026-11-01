import {
  advanceObstacles,
  changePlayerLane,
  createObstacle,
  createPlayer,
  jumpPlayer,
  obstacleHitsPlayer,
  PASSED_DISTANCE,
  resetPlayer,
  setPlayerDucking,
  updatePlayer,
  VIEW_DISTANCE,
} from './entities.js';
import { createRenderer } from './renderer.js';
import { createGestureController } from './gestures.js';
import { createPosePreview } from './pose-preview.js';
import { startPoseTracking } from './pose.js';

const canvas = document.querySelector('#game-canvas');
const renderer = createRenderer(canvas);
const scoreDisplay = document.querySelector('#score');
const startButton = document.querySelector('#start-button');
const startLabel = document.querySelector('#start-label');
const cameraButton = document.querySelector('#camera-button');
const cameraStatus = document.querySelector('#camera-status');
const cameraVideo = document.querySelector('#camera-video');
const cameraPreview = document.querySelector('#camera-preview');
const canvasWrap = document.querySelector('.canvas-wrap');
const poseCanvas = document.querySelector('#pose-canvas');
const posePreview = createPosePreview(poseCanvas, cameraStatus);
const gestureController = createGestureController();

const baseSpeed = 300;
const speedIncrease = 10;
const distancePerLevel = 300;
const player = createPlayer();
const obstacles = [];

let state = 'ready';
let distance = 0;
let score = 0;
let nextObstacleDistance = 0;
let lastFrame = 0;
let animationFrame = 0;
let stopPoseTracking;
let keyboardDucking = false;
let cameraDucking = false;
let appliedDucking = false;

function formatScore(value) {
  return Math.floor(value).toString().padStart(5, '0');
}

function randomGap() {
  return 430 + Math.random() * 210;
}

function resetGame() {
  state = 'playing';
  distance = 0;
  score = 0;
  resetPlayer(player);
  appliedDucking = keyboardDucking || cameraDucking;
  if (appliedDucking) setPlayerDucking(player, true);
  obstacles.length = 0;
  nextObstacleDistance = 680 + Math.random() * 170;
  scoreDisplay.textContent = formatScore(score);
  startLabel.textContent = 'Running';
  startButton.disabled = true;
  startButton.lastElementChild.textContent = '...';
  lastFrame = performance.now();
}

function startIfNeeded() {
  if (state === 'ready' || state === 'over') resetGame();
}

function jump() {
  startIfNeeded();
  if (state === 'playing') jumpPlayer(player);
}

function updateDucking() {
  const ducking = keyboardDucking || cameraDucking;
  if (ducking === appliedDucking) return;

  appliedDucking = ducking;
  if (ducking) startIfNeeded();
  if (state === 'playing') setPlayerDucking(player, ducking);
}

function changeLane(direction) {
  startIfNeeded();
  if (state === 'playing') changePlayerLane(player, direction);
}

function endGame() {
  state = 'over';
  startButton.disabled = false;
  startLabel.textContent = 'Run again';
  startButton.lastElementChild.textContent = '↗';
}

function spawnObstacle() {
  const kinds = ['hurdle', 'crate', 'cactus', 'largeCactus'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  obstacles.push(createObstacle(Math.floor(Math.random() * 3), nextObstacleDistance - distance, kind));
  nextObstacleDistance += randomGap();
}

function update(delta) {
  if (state !== 'playing') return;
  const level = Math.floor(distance / distancePerLevel);
  const speed = Math.min(baseSpeed + level * speedIncrease, 800);
  const traveled = speed * delta;
  distance += traveled;
  score = distance * 0.1;
  updatePlayer(player, delta);

  advanceObstacles(obstacles, traveled);
  while (nextObstacleDistance <= distance + VIEW_DISTANCE) spawnObstacle();

  for (const obstacle of obstacles) {
    if (obstacleHitsPlayer(player, obstacle)) {
      endGame();
      break;
    }
  }

  for (let index = obstacles.length - 1; index >= 0; index--) {
    if (obstacles[index].distance < -PASSED_DISTANCE) obstacles.splice(index, 1);
  }
  scoreDisplay.textContent = formatScore(score);
}

function draw() {
  renderer.draw({ player, obstacles, distance, state, score });
}

async function enableCamera() {
  cameraButton.disabled = true;
  cameraStatus.textContent = 'Starting camera and pose model...';
  gestureController.reset();
  try {
    stopPoseTracking = await startPoseTracking(
      cameraVideo,
      (results) => {
        posePreview.draw(results);
        const gesture = gestureController.update(results?.landmarks?.[0], performance.now());
        if (gesture.phase === 'waiting') {
          cameraStatus.textContent = 'Camera on · looking for a face...';
        } else if (gesture.phase === 'calibrating') {
          const secondsLeft = Math.ceil((1 - gesture.progress) * 2);
          cameraStatus.textContent = `Calibrating · hold still (${secondsLeft})`;
        } else if (gesture.phase === 'ready') {
          cameraStatus.textContent = 'Face calibrated · rise to jump, crouch to duck';
        } else if (!results?.landmarks?.[0]) {
          cameraStatus.textContent = 'Face not detected · keyboard still works';
        } else {
          cameraStatus.textContent = 'Face calibrated · rise to jump, crouch to duck';
        }

        if (gesture.action === 'jump') jump();
        cameraDucking = gesture.ducking;
        updateDucking();
      },
      (error) => {
        gestureController.reset();
        cameraDucking = false;
        updateDucking();
        cameraButton.disabled = false;
        cameraButton.textContent = 'Enable camera';
        cameraPreview.hidden = true;
        canvasWrap.classList.remove('camera-active');
        cameraStatus.textContent = `Pose tracking stopped: ${error.message}`;
        stopPoseTracking = undefined;
      },
    );
    cameraPreview.hidden = false;
    canvasWrap.classList.add('camera-active');
    cameraButton.disabled = false;
    cameraButton.textContent = 'Disable camera';
    cameraStatus.textContent = 'Camera on · looking for a pose...';
  } catch (error) {
    cameraButton.disabled = false;
    cameraStatus.textContent = `Could not start camera: ${error.message}`;
  }
}

function disableCamera() {
  stopPoseTracking?.();
  stopPoseTracking = undefined;
  gestureController.reset();
  cameraDucking = false;
  updateDucking();
  posePreview.clear();
  cameraPreview.hidden = true;
  canvasWrap.classList.remove('camera-active');
  cameraButton.textContent = 'Enable camera';
  cameraStatus.textContent = 'Camera off · video stays on this device';
}

function frame(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.04);
  lastFrame = now;
  update(delta);
  draw();
  animationFrame = requestAnimationFrame(frame);
}

startButton.addEventListener('click', () => {
  if (state !== 'playing') resetGame();
});

cameraButton.addEventListener('click', () => {
  if (stopPoseTracking) {
    disableCamera();
  } else {
    enableCamera();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    event.preventDefault();
    if (!event.repeat) changeLane(-1);
  } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    event.preventDefault();
    if (!event.repeat) changeLane(1);
  } else if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    jump();
  } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    event.preventDefault();
    if (!event.repeat) {
      keyboardDucking = true;
      updateDucking();
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    keyboardDucking = false;
    updateDucking();
  }
});

window.addEventListener('blur', () => {
  keyboardDucking = false;
  updateDucking();
});

lastFrame = performance.now();
animationFrame = requestAnimationFrame(frame);

window.addEventListener('pagehide', () => {
  cancelAnimationFrame(animationFrame);
  stopPoseTracking?.();
});