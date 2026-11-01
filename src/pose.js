import { FilesetResolver, PoseLandmarker } from '../vendor/mediapipe/vision_bundle.mjs';

export const poseConnections = PoseLandmarker.POSE_CONNECTIONS;

const wasmRoot = new URL('../vendor/mediapipe/wasm/', import.meta.url).href;
const modelPath = new URL('../models/pose_landmarker_lite.task', import.meta.url).href;

export async function startPoseTracking(video, onResults, onError) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access is unavailable. Use localhost or a secure HTTPS site.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
  });
  let landmarker;
  let frameRequest = 0;
  let active = true;

  function stop() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(frameRequest);
    landmarker?.close();
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    onResults(null);
  }

  try {
    video.srcObject = stream;
    await video.play();

    const vision = await FilesetResolver.forVisionTasks(wasmRoot);
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: modelPath },
      numPoses: 1,
      outputSegmentationMasks: false,
      runningMode: 'VIDEO',
    });

    let lastVideoTime = -1;
    let lastDetectionTime = 0;

    function detect(now) {
      if (!active) return;

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        && video.currentTime !== lastVideoTime
        && now - lastDetectionTime >= 50) {
        lastVideoTime = video.currentTime;
        lastDetectionTime = now;
        try {
          onResults(landmarker.detectForVideo(video, now));
        } catch (error) {
          stop();
          onError(error);
          return;
        }
      }

      frameRequest = requestAnimationFrame(detect);
    }

    frameRequest = requestAnimationFrame(detect);
    return stop;
  } catch (error) {
    active = false;
    landmarker?.close();
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    throw error;
  }
}
