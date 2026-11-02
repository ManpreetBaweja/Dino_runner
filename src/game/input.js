export function bindGameInput(controller, {
  normalRunButton,
  videoRunButton,
  calibrateButton,
  pauseButton,
}) {
  normalRunButton.addEventListener('click', controller.handleNormalRunClick);
  videoRunButton.addEventListener('click', controller.handleVideoRunClick);
  calibrateButton.addEventListener('click', controller.calibrateAgain);
  pauseButton.addEventListener('click', controller.togglePause);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      if (!event.repeat) controller.handlePauseKey(event);
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      event.preventDefault();
      if (!event.repeat) controller.changeLane(-1);
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      event.preventDefault();
      if (!event.repeat) controller.changeLane(1);
    } else if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      controller.jump();
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      event.preventDefault();
      if (!event.repeat) controller.setKeyboardDucking(true);
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      controller.setKeyboardDucking(false);
    }
  });
  window.addEventListener('blur', () => controller.setKeyboardDucking(false));
}
