const CALIBRATION_DURATION = 3000;
const MIN_LANDMARK_VISIBILITY = 0.5;
const JUMP_THRESHOLD = 0.75;
const DUCK_THRESHOLD = 0.75;
const DUCK_RELEASE_THRESHOLD = 0.45;
const JUMP_COOLDOWN = 600;
const SMOOTHING = 0.35;

function getFacePosition(landmarks) {
  const nose = landmarks?.[0];
  const leftEye = landmarks?.[2];
  const rightEye = landmarks?.[5];
  if (!nose || !leftEye || !rightEye) return null;

  for (const landmark of [nose, leftEye, rightEye]) {
    if (landmark.visibility !== undefined && landmark.visibility < MIN_LANDMARK_VISIBILITY) return null;
  }
  if (![nose.y, leftEye.x, leftEye.y, rightEye.x, rightEye.y].every(Number.isFinite)) return null;

  const eyeDistance = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);
  if (eyeDistance <= 0) return null;

  return { y: nose.y, eyeDistance };
}

export function createGestureController() {
  let calibrationStartedAt = null;
  let calibrationSamples = [];
  let baseline = null;
  let smoothedY = null;
  let reacquiringFace = false;
  let jumpArmed = true;
  let lastJumpAt = -Infinity;
  let ducking = false;

  function reset() {
    calibrationStartedAt = null;
    calibrationSamples = [];
    baseline = null;
    smoothedY = null;
    reacquiringFace = false;
    jumpArmed = true;
    lastJumpAt = -Infinity;
    ducking = false;
  }

  function rearm() {
    smoothedY = null;
    reacquiringFace = true;
    jumpArmed = false;
    lastJumpAt = -Infinity;
    ducking = false;
  }

  function update(landmarks, now) {
    const face = getFacePosition(landmarks);
    if (!face) {
      if (!baseline) {
        calibrationStartedAt = null;
        calibrationSamples = [];
      } else {
        smoothedY = null;
        reacquiringFace = true;
        ducking = false;
      }
      return {
        phase: baseline ? 'tracking' : 'waiting',
        action: null,
        ducking: false,
        progress: 0,
      };
    }

    if (!baseline) {
      if (calibrationStartedAt === null) calibrationStartedAt = now;
      calibrationSamples.push(face);
      const progress = Math.min((now - calibrationStartedAt) / CALIBRATION_DURATION, 1);
      if (progress < 1 || calibrationSamples.length < 10) {
        return { phase: 'calibrating', action: null, ducking: false, progress };
      }

      baseline = calibrationSamples.reduce(
        (average, sample) => ({
          y: average.y + sample.y / calibrationSamples.length,
          eyeDistance: average.eyeDistance + sample.eyeDistance / calibrationSamples.length,
        }),
        { y: 0, eyeDistance: 0 },
      );
      smoothedY = face.y;
      jumpArmed = true;
      return { phase: 'ready', action: null, ducking: false, progress: 1 };
    }

    if (reacquiringFace) {
      smoothedY = face.y;
      reacquiringFace = false;
      return { phase: 'tracking', action: null, ducking: false, progress: 1 };
    }

    smoothedY += (face.y - smoothedY) * SMOOTHING;
    const rise = (baseline.y - smoothedY) / baseline.eyeDistance;
    let action = null;

    if (rise < 0.25) jumpArmed = true;
    if (jumpArmed && rise >= JUMP_THRESHOLD && now - lastJumpAt >= JUMP_COOLDOWN) {
      action = 'jump';
      jumpArmed = false;
      lastJumpAt = now;
    }

    if (rise <= -DUCK_THRESHOLD) ducking = true;
    else if (rise > -DUCK_RELEASE_THRESHOLD) ducking = false;

    return { phase: 'tracking', action, ducking, progress: 1, rise };
  }

  return { rearm, reset, update };
}
