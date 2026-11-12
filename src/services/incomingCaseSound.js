export function playIncomingCaseSound({
  muted = false,
  createAudio = () => new Audio('/audio/incoming-call.wav'),
  gestureTarget = typeof document === 'undefined' ? null : document,
} = {}) {
  if (muted) return () => {};

  let active = true;
  let audio;
  const removeListeners = () => {
    gestureTarget?.removeEventListener('pointerdown', tryPlay);
    gestureTarget?.removeEventListener('keydown', tryPlay);
  };
  const tryPlay = () => {
    if (!active) return;
    try {
      Promise.resolve(audio.play()).then(() => {
        if (active) removeListeners();
      }).catch(() => {});
    } catch {
      // Some browsers require a user gesture before playback is permitted.
    }
  };

  try {
    audio = createAudio();
    audio.volume = 0.45;
    audio.loop = true;
    gestureTarget?.addEventListener('pointerdown', tryPlay);
    gestureTarget?.addEventListener('keydown', tryPlay);
    tryPlay();
  } catch {
    removeListeners();
  }

  return () => {
    if (!active) return;
    active = false;
    removeListeners();
    audio?.pause();
  };
}
