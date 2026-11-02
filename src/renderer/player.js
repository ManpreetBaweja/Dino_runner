export function drawPlayer(context, player, projection) {
  const centerX = projection.laneCenter(player.lanePosition, projection.playerDepth);
  const baseY = projection.playerGroundY - player.jumpHeight;

  context.fillStyle = 'rgba(32, 33, 36, 0.16)';
  context.beginPath();
  context.ellipse(centerX, projection.playerGroundY + 4, 25, 7, 0, 0, Math.PI * 2);
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
