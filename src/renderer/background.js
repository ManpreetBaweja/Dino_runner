import { PASSED_DISTANCE, VIEW_DISTANCE } from '../game/entities.js';

export function drawBackground(context, width, height, distance, projection) {
  const { horizonY, projectDistance, roadBottomY, roadHalfWidth } = projection;
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
