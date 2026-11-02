import { createCameraControls } from '../pose/camera-controls.js';
import { createGameController } from './controller.js';
import { bindGameInput } from './input.js';
import { createRenderer } from '../renderer/index.js';

const normalRunButton = document.querySelector('#normal-run-button');
const videoRunButton = document.querySelector('#video-run-button');
const calibrateButton = document.querySelector('#calibrate-button');
const pauseButton = document.querySelector('#pause-button');
const cameraStatus = document.querySelector('#camera-status');
let gameController;

const camera = createCameraControls({
  video: document.querySelector('#camera-video'),
  preview: document.querySelector('#camera-preview'),
  canvasWrap: document.querySelector('.canvas-wrap'),
  poseCanvas: document.querySelector('#pose-canvas'),
  statusElement: cameraStatus,
  onCalibrationComplete: () => gameController.completeCalibration(),
  onGesture: (gesture) => gameController.handleGesture(gesture),
  onCameraError: () => gameController.handleCameraError(),
  onStateChange: () => gameController?.refreshControls(),
});

gameController = createGameController({
  renderer: createRenderer(document.querySelector('#game-canvas')),
  scoreDisplay: document.querySelector('#score'),
  normalRunButton,
  videoRunButton,
  calibrateButton,
  pauseButton,
  cameraStatus,
  camera,
});

bindGameInput(gameController, {
  normalRunButton,
  videoRunButton,
  calibrateButton,
  pauseButton,
});

let animationFrame = 0;

function frame(now) {
  gameController.advanceFrame(now);
  animationFrame = requestAnimationFrame(frame);
}

gameController.refreshControls();
animationFrame = requestAnimationFrame(frame);

window.addEventListener('pagehide', () => {
  cancelAnimationFrame(animationFrame);
  camera.stop();
});
