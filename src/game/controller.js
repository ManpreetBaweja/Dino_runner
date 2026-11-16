import { createGameSimulation } from './simulation.js';

export function createGameController({
  renderer,
  scoreDisplay,
  normalRunButton,
  videoRunButton,
  calibrateButton,
  pauseButton,
  cameraStatus,
  camera,
}) {
  let state = 'ready';
  let mode = null;
  let lastFrame = performance.now();
  let keyboardDucking = false;
  let cameraDucking = false;
  let appliedDucking = false;
  let calibrationPending = false;
  const simulation = createGameSimulation(scoreDisplay, endGame);

  function updateControls() {
    const active = state === 'playing' || state === 'paused';
    normalRunButton.textContent = state === 'over'
      ? (mode === 'normal' ? 'Run again' : 'Switch to normal mode')
      : (mode === 'normal' && active ? 'Normal run active' : 'Start normal run');
    videoRunButton.textContent = state === 'over'
      ? (mode === 'video' ? 'Run again' : 'Switch to video-controlled mode')
      : (mode === 'video' && active ? 'Video-controlled run active' : 'Start video-controlled run');
    normalRunButton.disabled = active || camera.isStarting();
    videoRunButton.disabled = active || calibrationPending || camera.isStarting();
    calibrateButton.hidden = mode !== 'video' || !camera.isEnabled();
    calibrateButton.disabled = camera.isStarting();
    pauseButton.hidden = !active;
    pauseButton.textContent = state === 'paused' ? 'Resume' : 'Pause';
  }

  function resetGame(runMode) {
    mode = runMode;
    state = 'playing';
    cameraDucking = false;
    appliedDucking = keyboardDucking;
    simulation.reset(appliedDucking);
    lastFrame = performance.now();
    updateControls();
  }

  function updateDucking() {
    const ducking = state === 'playing' && (keyboardDucking || cameraDucking);
    if (ducking === appliedDucking) return;

    appliedDucking = ducking;
    if (state === 'playing') simulation.setDucking(ducking);
  }

  function endGame() {
    state = 'over';
    cameraDucking = false;
    updateDucking();
    updateControls();
  }

  function startIfNeeded() {
    if (state !== 'ready' && state !== 'over') return;
    if (calibrationPending) return;
    if (mode === 'video') camera.rearm();
    resetGame(mode ?? 'normal');
  }

  function jump() {
    startIfNeeded();
    if (state === 'playing') simulation.jump();
  }

  function changeLane(direction) {
    startIfNeeded();
    if (state === 'playing') simulation.changeLane(direction);
  }

  function beginCalibration() {
    mode = 'video';
    state = 'calibrating';
    calibrationPending = true;
    cameraDucking = false;
    updateDucking();
    camera.resetCalibration();
    updateControls();
  }

  function startVideoRun() {
    beginCalibration();
    if (camera.isEnabled()) return;
    return camera.start();
  }

  function startNormalRun() {
    camera.stop();
    calibrationPending = false;
    cameraStatus.textContent = 'Normal run · keyboard controls';
    resetGame('normal');
  }

  function runAgain() {
    if (mode === 'video') {
      if (camera.isEnabled()) {
        camera.rearm();
        resetGame('video');
      } else {
        startVideoRun();
      }
      return;
    }
    startNormalRun();
  }

  function handleNormalRunClick() {
    if (state === 'over' && mode === 'normal') runAgain();
    else startNormalRun();
  }

  function handleVideoRunClick() {
    if (state === 'over' && mode === 'video' && camera.isEnabled()) runAgain();
    else startVideoRun();
  }

  function calibrateAgain() {
    if (mode === 'video' && camera.isEnabled()) beginCalibration();
  }

  function completeCalibration() {
    calibrationPending = false;
    resetGame('video');
  }

  function handleGesture(gesture) {
    if (state === 'playing' && mode === 'video' && gesture.action === 'jump') jump();
    if (state === 'playing' && mode === 'video' && gesture.lane !== undefined) {
      simulation.setLane(gesture.lane);
    }
    cameraDucking = state === 'playing' && mode === 'video' && gesture.ducking;
    updateDucking();
  }

  function handleCameraError() {
    calibrationPending = false;
    if (state === 'calibrating') state = 'ready';
    cameraDucking = false;
    updateDucking();
    updateControls();
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      cameraDucking = false;
      appliedDucking = false;
      simulation.setDucking(false);
    } else if (state === 'paused') {
      state = 'playing';
      if (mode === 'video') camera.rearm();
      lastFrame = performance.now();
      updateDucking();
    }
    updateControls();
  }

  function advanceFrame(now) {
    const delta = Math.min((now - lastFrame) / 1000, 0.04);
    lastFrame = now;
    if (state === 'playing') simulation.update(delta);
    renderer.draw(simulation.snapshot(state));
  }

  function setKeyboardDucking(ducking) {
    keyboardDucking = ducking;
    updateDucking();
  }

  function handlePauseKey(event) {
    if (state === 'playing' || state === 'paused') {
      event.preventDefault();
      togglePause();
    }
  }

  return {
    advanceFrame,
    calibrateAgain,
    changeLane,
    completeCalibration,
    handleCameraError,
    handleGesture,
    handleNormalRunClick,
    handlePauseKey,
    handleVideoRunClick,
    jump,
    refreshControls: updateControls,
    setKeyboardDucking,
    togglePause,
  };
}
