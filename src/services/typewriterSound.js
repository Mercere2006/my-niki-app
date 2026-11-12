// One short key sound for each visible text update; blocked audio must not stop the game.
export function createTypewriterSound({ createAudio = () => new Audio('/audio/keyboard-key.wav') } = {}) {
  let audio;
  return {
    play({ previousCount, currentCount, muted = false, visible = true }) {
      if (muted || !visible || currentCount <= previousCount) return;
      try {
        audio ??= createAudio();
        audio.volume = 0.28;
        audio.playbackRate = [0.96, 1.04, 1, 1.08][currentCount % 4];
        audio.currentTime = 0;
        Promise.resolve(audio.play()).catch(() => {});
      } catch {
        // Audio can be unavailable or blocked by browser autoplay settings.
      }
    },
    stop() {
      try { audio?.pause(); } catch { /* Playback may already have ended. */ }
    },
  };
}
