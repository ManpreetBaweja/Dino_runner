export const VIEW_DISTANCE = 1000;
export const PASSED_DISTANCE = 280;

export function createPlayer() {
  return { lane: 1, lanePosition: 1, jumpHeight: 0, velocityY: 0, ducking: false };
}

export function resetPlayer(player) {
  player.lane = 1;
  player.lanePosition = 1;
  player.jumpHeight = 0;
  player.velocityY = 0;
  player.ducking = false;
}

export function changePlayerLane(player, direction) {
  player.lane = Math.max(0, Math.min(2, player.lane + direction));
}

export function jumpPlayer(player) {
  if (player.jumpHeight === 0 && !player.ducking) player.velocityY = 580;
}

export function setPlayerDucking(player, ducking) {
  player.ducking = ducking;
}

export function updatePlayer(player, delta) {
  player.lanePosition += (player.lane - player.lanePosition) * Math.min(1, delta * 14);
  player.jumpHeight = Math.max(0, player.jumpHeight + player.velocityY * delta);
  player.velocityY -= 1500 * delta;
  if (player.jumpHeight === 0) player.velocityY = 0;
}

export function createObstacle(lane, distance, kind) {
  return { lane, distance, kind };
}

export function advanceObstacles(obstacles, distance) {
  for (const obstacle of obstacles) obstacle.distance -= distance;
}

export function obstacleHitsPlayer(player, obstacle) {
  const inCollisionRange = obstacle.distance <= 48 && obstacle.distance >= -24;
  const inPlayerLane = obstacle.lane === player.lane;
  const avoided = obstacle.kind === 'hurdle' ? player.ducking : player.jumpHeight >= 35;
  return inCollisionRange && inPlayerLane && !avoided;
}