import { PASSED_DISTANCE, VIEW_DISTANCE } from './entities.js';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const horizonY = 112;
  const playerGroundY = 416;
  const roadBottomY = height + 80;
  const playerDepth = (playerGroundY - horizonY) / (roadBottomY - horizonY);

  function roadHalfWidth(progress) {
    return 48 + progress * 286;
  }

  function laneCenter(lane, progress) {
    return width / 2 + (lane - 1) * roadHalfWidth(progress) * 2 / 3;
  }

  function projectDistance(distanceAhead) {
    if (distanceAhead >= 0) {
      const depth = (1 - Math.min(distanceAhead / VIEW_DISTANCE, 1)) * playerDepth;
      return {
        y: horizonY + depth * (playerGroundY - horizonY) / playerDepth,
        depth,
      };
    }

    const passed = Math.min(-distanceAhead / PASSED_DISTANCE, 1);
    const visibleBottomDepth = (height - horizonY) / (roadBottomY - horizonY);
    return {
      y: playerGroundY + passed * (height - playerGroundY),
      depth: playerDepth + passed * (visibleBottomDepth - playerDepth),
    };
  }

  function drawBackground(distance) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    context.fillStyle = '#f1f3f4';
    context.beginPath();
    context.arc(660, 82, 27, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#e8eaed';
    context.beginPath();
    context.moveTo(0, 180);
    context.lineTo(170, 125);
    context.lineTo(322, 184);
    context.lineTo(470, 132);
    context.lineTo(650, 191);
    context.lineTo(800, 142);
    context.lineTo(800, roadBottomY);
    context.lineTo(0, roadBottomY);
    context.fill();

    context.fillStyle = '#f1f3f4';
    context.beginPath();
    context.moveTo(width / 2 - 48, horizonY);
    context.lineTo(width / 2 + 48, horizonY);
    context.lineTo(width / 2 + 334, roadBottomY);
    context.lineTo(width / 2 - 334, roadBottomY);
    context.closePath();
    context.fill();

    context.strokeStyle = '#5f6368';
    context.lineWidth = 2;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(width / 2 + side * 48, horizonY);
      context.lineTo(width / 2 + side * 334, roadBottomY);
      context.stroke();
    }

    const dashLength = 42;
    const dashSpacing = 120;
    const offset = distance % dashSpacing;
    const firstSegmentDistance = -offset - Math.ceil(PASSED_DISTANCE / dashSpacing) * dashSpacing;
    for (const laneBoundary of [-0.5, 0.5]) {
      for (let segmentDistance = firstSegmentDistance; segmentDistance < VIEW_DISTANCE; segmentDistance += dashSpacing) {
        const near = projectDistance(segmentDistance);
        const far = projectDistance(segmentDistance + dashLength);
        const xNear = width / 2 + laneBoundary * roadHalfWidth(near.depth) * 2 / 3;
        const xFar = width / 2 + laneBoundary * roadHalfWidth(far.depth) * 2 / 3;
        context.strokeStyle = '#9aa0a6';
        context.lineWidth = 1 + near.depth * 2;
        context.beginPath();
        context.moveTo(xFar, far.y);
        context.lineTo(xNear, near.y);
        context.stroke();
      }
    }
  }

  function drawObstacle(obstacle) {
    if (obstacle.distance > VIEW_DISTANCE || obstacle.distance < -PASSED_DISTANCE) return;

    const projection = projectDistance(obstacle.distance);
    const approach = 1 - obstacle.distance / VIEW_DISTANCE;
    const scale = 0.3 + approach * 0.95;
    const centerX = laneCenter(obstacle.lane, projection.depth);
    const baseY = projection.y;
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
      context.fillRect(centerX - obstacleWidth / 2, baseY - obstacleHeight, obstacleWidth, obstacleHeight);
      context.strokeStyle = '#e8eaed';
      context.lineWidth = Math.max(1, 2 * scale);
      context.strokeRect(centerX - obstacleWidth / 2 + 4 * scale, baseY - obstacleHeight + 4 * scale, obstacleWidth - 8 * scale, obstacleHeight - 8 * scale);
      context.beginPath();
      context.moveTo(centerX - obstacleWidth / 2 + 5 * scale, baseY - obstacleHeight + 5 * scale);
      context.lineTo(centerX + obstacleWidth / 2 - 5 * scale, baseY - 5 * scale);
      context.moveTo(centerX + obstacleWidth / 2 - 5 * scale, baseY - obstacleHeight + 5 * scale);
      context.lineTo(centerX - obstacleWidth / 2 + 5 * scale, baseY - 5 * scale);
      context.stroke();
      return;
    }

    if (obstacle.kind === 'largeCactus') {
      const trunkWidth = 14 * scale;
      const branchThickness = 7 * scale;
      const branchLength = 14 * scale;

      context.fillRect(centerX - trunkWidth / 2, baseY - obstacleHeight, trunkWidth, obstacleHeight);
      for (const [side, heightRatio] of [[-1, 0.84], [1, 0.66], [-1, 0.44], [1, 0.22]]) {
        const branchY = baseY - obstacleHeight * heightRatio;
        const branchX = side < 0 ? centerX - trunkWidth / 2 - branchLength : centerX + trunkWidth / 2;
        const tipX = side < 0 ? branchX : branchX + branchLength - branchThickness;
        context.fillRect(branchX, branchY, branchLength, branchThickness);
        context.fillRect(tipX, branchY - branchLength, branchThickness, branchLength);
      }
      return;
    }

    context.fillRect(centerX - 7 * scale, baseY - obstacleHeight, 14 * scale, obstacleHeight);
    context.fillRect(centerX - 15 * scale, baseY - obstacleHeight * 0.7, 9 * scale, 7 * scale);
    context.fillRect(centerX - 15 * scale, baseY - obstacleHeight * 0.84, 6 * scale, 13 * scale);
    context.fillRect(centerX + 6 * scale, baseY - obstacleHeight * 0.48, 9 * scale, 7 * scale);
    context.fillRect(centerX + 10 * scale, baseY - obstacleHeight * 0.64, 6 * scale, 14 * scale);
  }

  function drawPlayer(player) {
    const centerX = laneCenter(player.lanePosition, playerDepth);
    const baseY = playerGroundY - player.jumpHeight;

    context.fillStyle = 'rgba(32, 33, 36, 0.16)';
    context.beginPath();
    context.ellipse(centerX, playerGroundY + 4, 25, 7, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#202124';
    if (player.ducking) {
      context.fillRect(centerX - 28, baseY - 31, 51, 25);
      context.fillRect(centerX + 6, baseY - 28, 24, 18);
      context.fillStyle = '#ffffff';
      context.fillRect(centerX + 22, baseY - 25, 4, 4);
      context.fillStyle = '#202124';
      context.fillRect(centerX - 16, baseY - 8, 15, 8);
      context.fillRect(centerX + 8, baseY - 8, 15, 8);
      return;
    }

    context.fillRect(centerX - 19, baseY - 66, 38, 54);
    context.fillRect(centerX - 20, baseY - 59, 34, 24);
    context.fillStyle = '#ffffff';
    context.fillRect(centerX + 4, baseY - 53, 5, 5);
    context.fillStyle = '#202124';
    context.fillRect(centerX - 16, baseY - 12, 12, 12);
    context.fillRect(centerX + 5, baseY - 12, 12, 12);
  }

  function drawMessage(title, detail) {
    context.textAlign = 'center';
    context.fillStyle = '#202124';
    context.font = '700 28px Manrope, Segoe UI, sans-serif';
    context.fillText(title, width / 2, 205);
    context.fillStyle = '#5f6368';
    context.font = '13px "DM Mono", Consolas, monospace';
    context.fillText(detail, width / 2, 234);
    context.textAlign = 'start';
  }

  function draw({ player, obstacles, distance, state, score }) {
    drawBackground(distance);
    const orderedObstacles = [...obstacles].sort((a, b) => b.distance - a.distance);
    orderedObstacles.filter((obstacle) => obstacle.distance > 0).forEach(drawObstacle);
    drawPlayer(player);
    orderedObstacles.filter((obstacle) => obstacle.distance <= 0).forEach(drawObstacle);

    if (state === 'ready') drawMessage('Find your line.', 'LEFT / RIGHT TO SWITCH LANES  ·  SPACE TO JUMP');
    if (state === 'over') drawMessage('Run ended', `DISTANCE ${Math.floor(score).toString().padStart(5, '0')}  /  PRESS SPACE TO RUN AGAIN`);
  }

  return { draw };
}