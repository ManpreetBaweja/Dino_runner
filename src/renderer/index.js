import { drawBackground } from './background.js';
import { drawObstacle } from './obstacles.js';
import { drawPlayer } from './player.js';
import { createProjection } from './projection.js';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const projection = createProjection(width, height);

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
    drawBackground(context, width, height, distance, projection);
    const orderedObstacles = [...obstacles].sort((a, b) => b.distance - a.distance);
    orderedObstacles.filter((obstacle) => obstacle.distance > 0)
      .forEach((obstacle) => drawObstacle(context, obstacle, projection));
    drawPlayer(context, player, projection);
    orderedObstacles.filter((obstacle) => obstacle.distance <= 0)
      .forEach((obstacle) => drawObstacle(context, obstacle, projection));

    if (state === 'ready') drawMessage('Find your line.', 'CHOOSE A RUN MODE BELOW TO START');
    if (state === 'calibrating') drawMessage('Calibrating', 'HOLD A NEUTRAL FACE POSITION');
    if (state === 'paused') drawMessage('Paused', 'PRESS P OR SELECT RESUME');
    if (state === 'over') drawMessage('Run ended', `DISTANCE ${Math.floor(score).toString().padStart(5, '0')}  /  RUN AGAIN OR SWITCH MODE`);
  }

  return { draw };
}
