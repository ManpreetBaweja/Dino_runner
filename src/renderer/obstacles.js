import { PASSED_DISTANCE, VIEW_DISTANCE } from '../game/entities.js';

export function drawObstacle(context, obstacle, projection) {
  if (obstacle.distance > VIEW_DISTANCE || obstacle.distance < -PASSED_DISTANCE) return;

  const projected = projection.projectDistance(obstacle.distance);
  const approach = 1 - obstacle.distance / VIEW_DISTANCE;
  const scale = 0.3 + approach * 0.95;
  const centerX = projection.laneCenter(obstacle.lane, projected.depth);
  const baseY = projected.y;
  const obstacleWidth = (obstacle.kind === 'crate' ? 42 : obstacle.kind === 'hurdle' ? 58 : 34) * scale;
  const obstacleHeight = (obstacle.kind === 'crate' ? 46 : obstacle.kind === 'hurdle' ? 64 : obstacle.kind === 'largeCactus' ? 108 : 54) * scale;

  context.fillStyle = 'rgba(32, 33, 36, 0.18)';
  context.beginPath();
  context.ellipse(centerX, baseY + 2, obstacleWidth * 0.65, 5 * scale, 0, 0, Math.PI * 2);
  context.fill();

  if (obstacle.kind === 'hurdle') {
    const beamY = baseY - 54 * scale;
    const postWidth = 6 * scale;
    const beamHeight = 15 * scale;
    context.fillStyle = '#3c4043';
    context.fillRect(centerX - obstacleWidth / 2, beamY, postWidth, baseY - beamY);
    context.fillRect(centerX + obstacleWidth / 2 - postWidth, beamY, postWidth, baseY - beamY);
    context.fillRect(centerX - obstacleWidth / 2 - 3 * scale, beamY, obstacleWidth + 6 * scale, beamHeight);
    context.fillStyle = '#9aa0a6';
    context.fillRect(centerX - obstacleWidth / 2, beamY + 4 * scale, obstacleWidth, 3 * scale);
    return;
  }

  context.fillStyle = '#3c4043';
  if (obstacle.kind === 'crate') {
    drawCrate(context, centerX, baseY, obstacleWidth, obstacleHeight, scale);
    return;
  }

  if (obstacle.kind === 'largeCactus') {
    drawLargeCactus(context, centerX, baseY, obstacleHeight, scale);
    return;
  }

  drawCactus(context, centerX, baseY, obstacleHeight, scale);
}

function drawCrate(context, centerX, baseY, width, height, scale) {
  context.fillRect(centerX - width / 2, baseY - height, width, height);
  context.strokeStyle = '#e8eaed';
  context.lineWidth = Math.max(1, 2 * scale);
  context.strokeRect(centerX - width / 2 + 4 * scale, baseY - height + 4 * scale, width - 8 * scale, height - 8 * scale);
  context.beginPath();
  context.moveTo(centerX - width / 2 + 5 * scale, baseY - height + 5 * scale);
  context.lineTo(centerX + width / 2 - 5 * scale, baseY - 5 * scale);
  context.moveTo(centerX + width / 2 - 5 * scale, baseY - height + 5 * scale);
  context.lineTo(centerX - width / 2 + 5 * scale, baseY - 5 * scale);
  context.stroke();
}

function drawLargeCactus(context, centerX, baseY, height, scale) {
  const trunkWidth = 14 * scale;
  const branchThickness = 7 * scale;
  const branchLength = 14 * scale;

  context.fillRect(centerX - trunkWidth / 2, baseY - height, trunkWidth, height);
  for (const [side, heightRatio] of [[-1, 0.84], [1, 0.66], [-1, 0.44], [1, 0.22]]) {
    const branchY = baseY - height * heightRatio;
    const branchX = side < 0 ? centerX - trunkWidth / 2 - branchLength : centerX + trunkWidth / 2;
    const tipX = side < 0 ? branchX : branchX + branchLength - branchThickness;
    context.fillRect(branchX, branchY, branchLength, branchThickness);
    context.fillRect(tipX, branchY - branchLength, branchThickness, branchLength);
  }
}

function drawCactus(context, centerX, baseY, height, scale) {
  context.fillRect(centerX - 7 * scale, baseY - height, 14 * scale, height);
  context.fillRect(centerX - 15 * scale, baseY - height * 0.7, 9 * scale, 7 * scale);
  context.fillRect(centerX - 15 * scale, baseY - height * 0.84, 6 * scale, 13 * scale);
  context.fillRect(centerX + 6 * scale, baseY - height * 0.48, 9 * scale, 7 * scale);
  context.fillRect(centerX + 10 * scale, baseY - height * 0.64, 6 * scale, 14 * scale);
}
