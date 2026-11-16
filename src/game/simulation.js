import {
  advanceObstacles,
  changePlayerLane,
  createObstacle,
  createPlayer,
  jumpPlayer,
  obstacleHitsPlayer,
  PASSED_DISTANCE,
  resetPlayer,
  setPlayerLane,
  setPlayerDucking,
  updatePlayer,
  VIEW_DISTANCE,
} from './entities.js';

const BASE_SPEED = 300;
const SPEED_INCREASE = 10;
const DISTANCE_PER_LEVEL = 300;
const OBSTACLE_KINDS = ['hurdle', 'crate', 'cactus', 'largeCactus'];

export function createGameSimulation(scoreDisplay, onGameOver) {
  const player = createPlayer();
  const obstacles = [];
  let distance = 0;
  let score = 0;
  let nextObstacleDistance = 0;

  function formatScore(value) {
    return Math.floor(value).toString().padStart(5, '0');
  }

  function reset(keyboardDucking) {
    distance = 0;
    score = 0;
    resetPlayer(player);
    if (keyboardDucking) setPlayerDucking(player, true);
    obstacles.length = 0;
    nextObstacleDistance = 680 + Math.random() * 170;
    scoreDisplay.textContent = formatScore(score);
  }

  function spawnObstacle() {
    const kind = OBSTACLE_KINDS[Math.floor(Math.random() * OBSTACLE_KINDS.length)];
    obstacles.push(createObstacle(Math.floor(Math.random() * 3), nextObstacleDistance - distance, kind));
    nextObstacleDistance += 430 + Math.random() * 210;
  }

  function update(delta) {
    const level = Math.floor(distance / DISTANCE_PER_LEVEL);
    const speed = Math.min(BASE_SPEED + level * SPEED_INCREASE, 800);
    const traveled = speed * delta;
    distance += traveled;
    score = distance * 0.1;
    updatePlayer(player, delta);
    advanceObstacles(obstacles, traveled);
    while (nextObstacleDistance <= distance + VIEW_DISTANCE) spawnObstacle();

    for (const obstacle of obstacles) {
      if (obstacleHitsPlayer(player, obstacle)) {
        onGameOver();
        break;
      }
    }

    for (let index = obstacles.length - 1; index >= 0; index--) {
      if (obstacles[index].distance < -PASSED_DISTANCE) obstacles.splice(index, 1);
    }
    scoreDisplay.textContent = formatScore(score);
  }

  function snapshot(state) {
    return { player, obstacles, distance, state, score };
  }

  function jump() {
    jumpPlayer(player);
  }

  function changeLane(direction) {
    changePlayerLane(player, direction);
  }

  function setLane(lane) {
    setPlayerLane(player, lane);
  }

  function setDucking(ducking) {
    setPlayerDucking(player, ducking);
  }

  return { changeLane, jump, reset, setDucking, setLane, snapshot, update };
}
