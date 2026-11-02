import { poseConnections } from './pose.js';

const MIN_LANDMARK_VISIBILITY = 0.5;
const BACKGROUND_COLOR = '#f1f3f4';
const FIGURE_COLOR = '#202124';

export function createPosePreview(canvas) {
  const context = canvas.getContext('2d');

  function draw(results, countdown = null) {
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const landmarks = results?.landmarks?.[0];
    if (!landmarks) {
      context.fillStyle = '#5f6368';
      context.font = '16px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Center face in frame', canvas.width / 2, canvas.height / 2);
      drawCalibrationOverlay(countdown);
      return;
    }

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = FIGURE_COLOR;
    context.lineWidth = 9;
    for (const connection of poseConnections) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      if (!isVisible(start) || !isVisible(end)) continue;

      context.beginPath();
      context.moveTo(start.x * canvas.width, start.y * canvas.height);
      context.lineTo(end.x * canvas.width, end.y * canvas.height);
      context.stroke();
    }

    drawHead(landmarks);
    context.fillStyle = FIGURE_COLOR;
    for (const landmark of landmarks) {
      if (!isVisible(landmark)) continue;
      context.beginPath();
      context.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, Math.PI * 2);
      context.fill();
    }
    drawCalibrationOverlay(countdown);
  }

  function drawCalibrationOverlay(countdown) {
    if (countdown === null) return;

    context.fillStyle = 'rgba(32, 33, 36, 0.4)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.55)';
    context.shadowBlur = 8;
    context.fillStyle = '#ffffff';
    context.font = '700 64px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(countdown), canvas.width / 2, canvas.height / 2);
    context.restore();
  }

  function isVisible(landmark) {
    return landmark
      && (landmark.visibility === undefined || landmark.visibility >= MIN_LANDMARK_VISIBILITY);
  }

  function drawHead(landmarks) {
    const faceLandmarks = landmarks.slice(0, 11).filter(isVisible);
    if (faceLandmarks.length < 2) return;

    const facePoints = faceLandmarks.map((landmark) => ({
      x: landmark.x * canvas.width,
      y: landmark.y * canvas.height,
    }));
    const minX = Math.min(...facePoints.map((point) => point.x));
    const maxX = Math.max(...facePoints.map((point) => point.x));
    const minY = Math.min(...facePoints.map((point) => point.y));
    const maxY = Math.max(...facePoints.map((point) => point.y));
    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const headWidth = Math.max(faceWidth * 1.35, 24);
    const headHeight = Math.max(faceHeight * 1.3, faceWidth * 1.65, 32);

    context.beginPath();
    context.ellipse(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      headWidth / 2 + 8,
      headHeight / 2 + 8,
      0,
      0,
      Math.PI * 2,
    );
    context.strokeStyle = FIGURE_COLOR;
    context.lineWidth = 8;
    context.stroke();
  }

  function clear() {
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return { draw, clear };
}
