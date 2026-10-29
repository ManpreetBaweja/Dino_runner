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

const canvas = document.querySelector('#game-canvas');
const renderer = createRenderer(canvas);
const scoreDisplay = document.querySelector('#score');
const startButton = document.querySelector('#start-button');
const startLabel = document.querySelector('#start-label');

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

function setDucking(ducking) {
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
  const speed = baseSpeed + level * speedIncrease;
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
    if (!event.repeat) setDucking(true);
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowDown' || event.code === 'KeyS') setDucking(false);
});

window.addEventListener('blur', () => setDucking(false));

lastFrame = performance.now();
animationFrame = requestAnimationFrame(frame);

window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame));