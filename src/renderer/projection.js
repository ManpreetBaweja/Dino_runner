import { PASSED_DISTANCE, VIEW_DISTANCE } from '../game/entities.js';

export function createProjection(width, height) {
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

  return {
    horizonY,
    laneCenter,
    playerDepth,
    playerGroundY,
    projectDistance,
    roadBottomY,
    roadHalfWidth,
  };
}
