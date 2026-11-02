import { createGestureController } from './gestures.js';
import { createPosePreview } from './pose-preview.js';
import { startPoseTracking } from './pose.js';

export function createCameraControls({
  video,
  preview,
  canvasWrap,
  poseCanvas,
  statusElement,
  onCalibrationComplete,
  onGesture,
  onCameraError,
  onStateChange,
}) {
  const posePreview = createPosePreview(poseCanvas);
  const gestureController = createGestureController();
  let stopPoseTracking;
  let starting = false;
  let generation = 0;

  function setStatus(message) {
    statusElement.textContent = message;
  }

  function resetCalibration() {
    gestureController.reset();
    setStatus('Center your face in the preview to calibrate');
  }

  function handlePoseResults(results) {
    const landmarks = results?.landmarks?.[0];
    const gesture = gestureController.update(landmarks, performance.now());
    const countdown = gesture.phase === 'calibrating'
      ? Math.max(1, Math.ceil((1 - gesture.progress) * 3))
      : null;
    posePreview.draw(results, countdown);

    if (gesture.phase === 'waiting') {
      setStatus('Face not detected · center your face in the preview');
    } else if (gesture.phase === 'calibrating') {
      setStatus(`Calibrating · hold still (${countdown})`);
    } else if (gesture.phase === 'ready') {
      setStatus('Calibration complete · starting video-controlled run');
      onCalibrationComplete();
    } else if (!landmarks?.length) {
      setStatus('Face not detected · keyboard still works');
    } else {
      setStatus('Video controls ready · raise to jump, lower to duck');
    }

    if (gesture.phase !== 'ready') onGesture(gesture);
  }

  function handlePoseError(error) {
    generation++;
    stopPoseTracking = undefined;
    starting = false;
    gestureController.reset();
    preview.hidden = true;
    canvasWrap.classList.remove('camera-active');
    setStatus(`Camera/model error: ${error.message}`);
    onCameraError();
  }

  async function start() {
    const currentGeneration = ++generation;
    starting = true;
    setStatus('Starting camera and pose model...');
    onStateChange();

    try {
      const stopTracking = await startPoseTracking(
        video,
        (results) => {
          if (currentGeneration === generation) handlePoseResults(results);
        },
        (error) => {
          if (currentGeneration === generation) handlePoseError(error);
        },
      );
      if (currentGeneration !== generation) {
        stopTracking();
        return;
      }

      stopPoseTracking = stopTracking;
      starting = false;
      preview.hidden = false;
      canvasWrap.classList.add('camera-active');
      onStateChange();
    } catch (error) {
      if (currentGeneration !== generation) return;
      starting = false;
      gestureController.reset();
      preview.hidden = true;
      canvasWrap.classList.remove('camera-active');
      setStatus(`Could not start camera/model: ${error.message}`);
      onCameraError();
    }
  }

  function stop() {
    generation++;
    stopPoseTracking?.();
    stopPoseTracking = undefined;
    starting = false;
    gestureController.reset();
    posePreview.clear();
    preview.hidden = true;
    canvasWrap.classList.remove('camera-active');
    onStateChange();
  }

  return {
    isEnabled: () => Boolean(stopPoseTracking),
    isStarting: () => starting,
    rearm: () => gestureController.rearm(),
    resetCalibration,
    start,
    stop,
  };
}
